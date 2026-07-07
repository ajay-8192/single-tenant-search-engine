package ipc

import (
	"context"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"services/crawler-gateway-go/internal/ipc/pb"
)

type IPCClient struct {
	client pb.HTMLProcessorClient
	conn   *grpc.ClientConn
}

func NewIPCClient(serverAddr string) (*IPCClient, error) {
	// Connect to C++ server via TCP loopback (or Unix Domain Socket)
	conn, err := grpc.NewClient(serverAddr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}
	
	client := pb.NewHTMLProcessorClient(conn)
	return &IPCClient{
		client: client,
		conn:   conn,
	}, nil
}

func (c *IPCClient) Close() error {
	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}

func (c *IPCClient) ExtractAndTokenize(ctx context.Context, targetURL, rawHTML string) (*pb.ProcessDocumentResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	return c.client.ExtractAndTokenize(ctx, &pb.ProcessDocumentRequest{
		TargetUrl:      targetURL,
		RawHtmlContent: rawHTML,
	})
}
