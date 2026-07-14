import React, { useState } from 'react';

const UserDirectory = () => {
  const [users, setUsers] = useState([
    {
      email: 'sysadmin@origin.local',
      role: 'ROOT',
      subtext: 'Origin Creator',
      read: true,
      write: true,
      immutable: true,
    },
    {
      email: 'j.doe@crawlsuite.dev',
      role: 'Admin',
      subtext: 'Last Active: 2h ago',
      read: true,
      write: true,
      immutable: false,
    },
    {
      email: 'a.smith@crawlsuite.dev',
      role: 'Analyst',
      subtext: 'Last Active: 1d ago',
      read: true,
      write: false,
      immutable: false,
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('analyst');
  const [formError, setFormError] = useState(null);

  const handleInvite = (e) => {
    e.preventDefault();
    setFormError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inviteEmail.trim() || !emailRegex.test(inviteEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setFormError('Identity is already registered.');
      return;
    }

    const roleName =
      inviteRole === 'admin' ? 'Admin' : inviteRole === 'operator' ? 'Operator' : 'Analyst';
    const newUser = {
      email: inviteEmail.trim(),
      role: roleName,
      subtext: 'Pending Invite',
      read: true,
      write: inviteRole !== 'analyst',
      immutable: false,
    };

    setUsers([...users, newUser]);
    setInviteEmail('');
  };

  const handleDelete = (email) => {
    setUsers(users.filter((u) => u.email !== email));
  };

  const toggleRead = (email) => {
    setUsers(
      users.map((u) => {
        if (u.email === email && !u.immutable) {
          return { ...u, read: !u.read };
        }
        return u;
      })
    );
  };

  const toggleWrite = (email) => {
    setUsers(
      users.map((u) => {
        if (u.email === email && !u.immutable) {
          return { ...u, write: !u.write };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 text-[#dae2fd]">
      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#c3f5ff] mb-2">Access Control Portal</h2>
          <p className="text-xs text-[#bac9cc] max-w-2xl leading-relaxed">
            Manage workspace internal staff permissions, invite new team members, and monitor cryptographic access logs across the Crawler Suite ecosystem.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#131b2e] border border-[#3b494c] rounded p-3 min-w-[120px] text-center">
            <p className="text-[10px] text-[#bac9cc] uppercase tracking-wider mb-1">Total Seats</p>
            <p className="text-xl font-bold text-[#c3f5ff] font-mono">{users.length} / 50</p>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invite Form Card (Left Column, span 4) */}
        <div className="lg:col-span-4 bg-[#131b2e] border border-[#3b494c] rounded-lg p-6 flex flex-col h-fit">
          <div className="flex items-center gap-2 mb-6 border-b border-[#3b494c] pb-3">
            <span className="material-symbols-outlined text-[#00daf3]">person_add</span>
            <h3 className="text-sm font-bold text-[#dae2fd] uppercase tracking-wide">Invite Internal Member</h3>
          </div>
          
          <form className="flex flex-col gap-4" onSubmit={handleInvite}>
            <div>
              <label className="block text-[10px] font-mono text-[#bac9cc] mb-1.5 uppercase tracking-wider">Email Address</label>
              <input
                className="w-full bg-[#0b1326] border border-[#3b494c] rounded px-3 py-2 text-sm text-[#dae2fd] focus:outline-none focus:border-[#00daf3] focus:ring-1 focus:ring-[#00daf3] transition-colors placeholder-[#3b494c]"
                placeholder="agent@crawlsuite.dev"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-mono text-[#bac9cc] mb-1.5 uppercase tracking-wider">Access Profile</label>
              <div className="relative">
                <select
                  className="w-full bg-[#0b1326] border border-[#3b494c] rounded px-3 py-2 text-sm text-[#dae2fd] appearance-none focus:outline-none focus:border-[#00daf3] focus:ring-1 focus:ring-[#00daf3] transition-colors cursor-pointer"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="analyst">Data Analyst (Read-Only)</option>
                  <option value="operator">Crawler Operator (Execute)</option>
                  <option value="admin">System Admin (Full Access)</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#bac9cc] pointer-events-none text-sm">
                  expand_more
                </span>
              </div>
            </div>

            {formError && (
              <p className="text-xs text-[#ffb4ab] mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {formError}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-[#3b494c] flex justify-end">
              <button
                className="bg-[#00daf3] text-[#00363d] font-bold text-xs uppercase tracking-wide px-4 py-2.5 rounded hover:brightness-110 transition-all flex items-center gap-2 w-full justify-center"
                type="submit"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                Issue Access Token
              </button>
            </div>
          </form>
        </div>

        {/* Access Control List Table (Right Column, span 8) */}
        <div className="lg:col-span-8 bg-[#131b2e] border border-[#3b494c] rounded-lg flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 border-b border-[#3b494c] flex items-center justify-between bg-[#222a3d]/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#bac9cc]">policy</span>
              <h3 className="text-sm font-bold text-[#dae2fd] uppercase tracking-wide">Active Directory Matrix</h3>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#131b2e] border-b border-[#3b494c]">
                  <th className="p-4 text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider whitespace-nowrap">Identity</th>
                  <th className="p-4 text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider whitespace-nowrap">Role</th>
                  <th className="p-4 text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider text-center whitespace-nowrap">Read Analytics</th>
                  <th className="p-4 text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider text-center whitespace-nowrap">Write &amp; Execute</th>
                  <th className="p-4 text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3b494c]/30">
                {users.map((user) => (
                  <tr
                    key={user.email}
                    className={`border-b border-[#3b494c]/30 hover:bg-[#222a3d]/30 transition-colors ${
                      user.immutable ? 'bg-[#0b1326]/50 cursor-not-allowed' : 'bg-[#131b2e]'
                    }`}
                    title={user.immutable ? 'Root identity permissions are immutable.' : ''}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                            user.role === 'ROOT' ? 'bg-[#ffc681] text-[#2a1700]' : 'bg-[#222a3d] border border-[#3b494c] text-[#bac9cc]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {user.role === 'ROOT' ? 'shield_person' : 'person'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#dae2fd]">{user.email}</p>
                          <p className="text-[10px] text-[#bac9cc] opacity-75 font-mono">{user.subtext}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          user.role === 'ROOT'
                            ? 'bg-[#ffc681]/15 text-[#ffc681] border-[#ffc681]/30'
                            : 'bg-[#2d3449] text-[#bac9cc] border-[#3b494c]'
                        }`}
                      >
                        {user.role === 'ROOT' && <span className="material-symbols-outlined text-[12px]">star</span>}
                        {user.role}
                      </span>
                    </td>
                    
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleRead(user.email)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          user.immutable
                            ? 'bg-[#3d494c] opacity-50 cursor-not-allowed'
                            : user.read
                            ? 'bg-[#00daf3] cursor-pointer'
                            : 'bg-[#2d3449] border border-[#3b494c] cursor-pointer'
                        }`}
                        disabled={user.immutable}
                        type="button"
                      >
                        <span
                          className={`inline-block h-3 w-3 rounded-full transition-transform ${
                            user.read ? 'translate-x-5 bg-[#00363d]' : 'translate-x-1 bg-[#849396]'
                          }`}
                        ></span>
                      </button>
                    </td>
                    
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleWrite(user.email)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          user.immutable
                            ? 'bg-[#3d494c] opacity-50 cursor-not-allowed'
                            : user.write
                            ? 'bg-[#00daf3] cursor-pointer'
                            : 'bg-[#2d3449] border border-[#3b494c] cursor-pointer'
                        }`}
                        disabled={user.immutable}
                        type="button"
                      >
                        <span
                          className={`inline-block h-3 w-3 rounded-full transition-transform ${
                            user.write ? 'translate-x-5 bg-[#00363d]' : 'translate-x-1 bg-[#849396]'
                          }`}
                        ></span>
                      </button>
                    </td>
                    
                    <td className="p-4 text-right">
                      {user.immutable ? (
                        <span className="material-symbols-outlined text-[#3b494c] opacity-50 text-sm">lock</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(user.email)}
                          className="text-[#bac9cc] hover:text-[#ffb4ab] transition-colors p-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDirectory;
