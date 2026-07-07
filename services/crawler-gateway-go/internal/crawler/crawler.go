package crawler

import (
	"context"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"time"
)

type ScrapeResult struct {
	URL        string
	HTMLBody   string
	ErrorFault error
}

type WebCrawlerWorker struct {
	httpClient *http.Client
	userAgent  string
}

func NewCrawlerWorker(ua string) *WebCrawlerWorker {
	if ua == "" {
		ua = "StandaloneVerticalCrawler/1.0"
	}
	return &WebCrawlerWorker{
		httpClient: &http.Client{
			Timeout: 10 * time.Second, // Timeout to guard threads from hanging requests
		},
		userAgent: ua,
	}
}

func (w *WebCrawlerWorker) FetchRawHTML(ctx context.Context, targetURL string) (*ScrapeResult, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", w.userAgent)

	resp, err := w.httpClient.Do(req)
	if err != nil {
		return &ScrapeResult{URL: targetURL, ErrorFault: err}, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return &ScrapeResult{URL: targetURL, ErrorFault: err}, err
	}

	return &ScrapeResult{
		URL:      targetURL,
		HTMLBody: string(bodyBytes),
	}, nil
}

// ExtractDomainLinks parses same-domain absolute hyperlinks from raw HTML content
func ExtractDomainLinks(htmlContent, baseLink string) []string {
	baseURL, err := url.Parse(baseLink)
	if err != nil {
		return nil
	}

	// Regex to extract href attributes
	re := regexp.MustCompile(`(?i)href=["'](https?://[^"']+|/[^"']+|[^"']+)["']`)
	matches := re.FindAllStringSubmatch(htmlContent, -1)

	var links []string
	seen := make(map[string]bool)

	for _, match := range matches {
		rawPath := match[1]
		parsedPath, err := url.Parse(rawPath)
		if err != nil {
			continue
		}

		resolved := baseURL.ResolveReference(parsedPath)
		
		// Enforce vertical boundaries: Only crawl matching host domains
		if resolved.Host == baseURL.Host {
			// Clear fragments or queries if desired for uniqueness
			resolved.Fragment = ""
			cleaned := resolved.String()
			
			if !seen[cleaned] {
				seen[cleaned] = true
				links = append(links, cleaned)
			}
		}
	}
	return links
}
