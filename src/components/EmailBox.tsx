import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Mail, RefreshCw, Copy, Edit2, AlertCircle, ChevronDown } from 'lucide-react';
import { GuerrillaClient } from '../lib/guerrilla';

interface Email {
  mail_id: string;
  mail_from: string;
  mail_subject: string;
  mail_excerpt: string;
  mail_timestamp: string;
  mail_read: string;
  mail_date: string;
  mail_body?: string;
}

const REFRESH_INTERVAL = 15000;
const EMAIL_STORAGE_KEY = 'tempmail_email';
const EMAILS_STORAGE_KEY = 'tempmail_emails';
const DOMAIN_STORAGE_KEY = 'tempmail_domain';
const EMAIL_TIMESTAMP_KEY = 'tempmail_timestamp';
const LAST_EMAIL_CHANGE_KEY = 'tempmail_last_change';
const SESSION_STORAGE_KEY = 'tempmail_session';
const ONE_HOUR = 3600000;
const RATE_LIMIT_COOLDOWN = ONE_HOUR;

const EMAIL_DOMAINS = {
  sharklasers: '@sharklasers.com',
  guerrillamailblock: '@guerrillamailblock.com',
  guerrillamail: '@guerrillamail.com',
  guerrillamail_info: '@guerrillamail.info',
  grr: '@grr.la',
  guerrillamail_biz: '@guerrillamail.biz',
  guerrillamail_de: '@guerrillamail.de',
  guerrillamail_net: '@guerrillamail.net',
  guerrillamail_org: '@guerrillamail.org',
  pokemail: '@pokemail.net',
  spam: '@spam.me'
} as const;

const EditButton: React.FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => {
  const [remainingMinutes, setRemainingMinutes] = useState<number>(0);

  useEffect(() => {
    if (disabled) {
      const lastChange = localStorage.getItem(LAST_EMAIL_CHANGE_KEY);
      if (lastChange) {
        const updateRemainingTime = () => {
          const now = Date.now();
          const timeSinceLastChange = now - Number(lastChange);
          const remainingMs = Math.max(0, RATE_LIMIT_COOLDOWN - timeSinceLastChange);
          setRemainingMinutes(Math.ceil(remainingMs / 60000));
        };

        updateRemainingTime();
        const interval = setInterval(updateRemainingTime, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [disabled]);

  return (
    <button 
      onClick={onClick} 
      className={`group relative p-2 hover:bg-gray-100 rounded-full transition-colors ${
        disabled ? 'cursor-not-allowed' : ''
      }`}
      title={disabled ? `Wait ${remainingMinutes} minutes to customize` : 'Change Email'}
      disabled={disabled}
      aria-label={disabled ? `Wait ${remainingMinutes} minutes to customize email` : 'Change email address'}
    >
      <Edit2 className={`w-4 h-4 ${disabled ? 'text-gray-400' : ''}`} aria-hidden="true" />
      {disabled && remainingMinutes > 0 && (
        <div className="hidden group-hover:block absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-50">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <div className="border-4 border-transparent border-t-gray-800"></div>
          </div>
          Wait {remainingMinutes} minute{remainingMinutes !== 1 ? 's' : ''} to customize
        </div>
      )}
    </button>
  );
};

const EmailBox = () => {
  const [client] = useState(() => new GuerrillaClient());
  const [emailAddress, setEmailAddress] = useState('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newEmailUser, setNewEmailUser] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<keyof typeof EMAIL_DOMAINS>('sharklasers');
  const [emailTimestamp, setEmailTimestamp] = useState<number>(0);
  const [canCustomize, setCanCustomize] = useState(true);
  const refreshTimerRef = useRef<number>();
  const lastCheckRef = useRef<number>(0);

  const getDisplayEmail = useCallback(() => {
    const username = emailAddress.split('@')[0];
    return `${username}${EMAIL_DOMAINS[selectedDomain]}`;
  }, [emailAddress, selectedDomain]);

  const checkEmails = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const now = Date.now();
      if (now - lastCheckRef.current < 5000) {
        return;
      }
      lastCheckRef.current = now;

      const response = await client.checkEmail();
      setEmails(prevEmails => {
        const emailMap = new Map(prevEmails.map(email => [email.mail_id, email]));
        response.list.forEach(email => emailMap.set(email.mail_id, email));
        return Array.from(emailMap.values()).sort((a, b) => 
          Number(b.mail_timestamp) - Number(a.mail_timestamp)
        );
      });
    } catch (error) {
      console.error('Failed to check emails:', error);
      setError('Failed to check emails. Please try again.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [client]);

  const debouncedCheckEmails = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (showLoading = false) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => checkEmails(showLoading), 300);
      };
    })(),
    [checkEmails]
  );

  const handleEmailClick = useCallback(async (email: Email) => {
    try {
      setError(null);
      const fullEmail = await client.fetchEmail(email.mail_id);
      setSelectedEmail({ ...email, mail_body: fullEmail.mail_body });
    } catch (error) {
      console.error('Failed to fetch email:', error);
      setError('Failed to fetch email content. Please try again.');
    }
  }, [client]);

  const handleCopy = useCallback(() => {
    const displayEmail = getDisplayEmail();
    navigator.clipboard.writeText(displayEmail).catch(console.error);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  }, [getDisplayEmail]);

  const handleRefresh = useCallback(() => {
    checkEmails(true);
  }, [checkEmails]);

  const renderEmailContent = useCallback((content: string) => {
    try {
      return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />;
    } catch (error) {
      console.error('Failed to render email content:', error);
      return <div className="text-red-600">Error rendering email content</div>;
    }
  }, []);

  const canChangeEmail = () => {
    const lastChange = localStorage.getItem(LAST_EMAIL_CHANGE_KEY);
    if (!lastChange) return true;
    
    const now = Date.now();
    const timeSinceLastChange = now - Number(lastChange);
    return timeSinceLastChange >= RATE_LIMIT_COOLDOWN;
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCustomize) {
      setError('Please wait 60 minutes before customizing your email again.');
      return;
    }

    if (!canChangeEmail()) {
      const lastChange = Number(localStorage.getItem(LAST_EMAIL_CHANGE_KEY));
      const waitMinutes = Math.ceil((RATE_LIMIT_COOLDOWN - (Date.now() - lastChange)) / 60000);
      setError(`Please wait ${waitMinutes} minutes before changing email again to avoid rate limiting.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await client.setEmailUser(newEmailUser);
      setEmailAddress(response.email_addr);
      setIsEditing(false);
      setEmailTimestamp(Date.now());
      localStorage.setItem(LAST_EMAIL_CHANGE_KEY, String(Date.now()));
      checkEmails(false);
    } catch (error) {
      console.error('Failed to change email:', error);
      setError('Failed to change email address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDomainChange = async (domain: keyof typeof EMAIL_DOMAINS) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedDomain(domain);
      const username = emailAddress.split('@')[0];
      const response = await client.setEmailUser(username);
      setEmailAddress(response.email_addr);
      setNewEmailUser(username);
      localStorage.setItem(DOMAIN_STORAGE_KEY, domain);
      checkEmails(false);
    } catch (error) {
      console.error('Failed to change domain:', error);
      setError('Failed to change email domain. Please try again.');
      setSelectedDomain(prevDomain => prevDomain);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
    const savedEmails = localStorage.getItem(EMAILS_STORAGE_KEY);
    const savedDomain = localStorage.getItem(DOMAIN_STORAGE_KEY) as keyof typeof EMAIL_DOMAINS;
    const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    
    const sessionTimestamp = savedSession ? JSON.parse(savedSession).timestamp : null;
    const cookieTimestamp = document.cookie
      .split('; ')
      .find(row => row.startsWith('email_timestamp='))
      ?.split('=')[1];
    
    const savedTimestamp = sessionTimestamp || cookieTimestamp || localStorage.getItem(EMAIL_TIMESTAMP_KEY);
    
    if (savedEmail) {
      setEmailAddress(savedEmail);
      setNewEmailUser(savedEmail.split('@')[0]);
    }
    
    if (savedEmails) {
      try {
        setEmails(JSON.parse(savedEmails));
      } catch (e) {
        console.error('Failed to parse saved emails:', e);
      }
    }

    if (savedDomain && EMAIL_DOMAINS[savedDomain]) {
      setSelectedDomain(savedDomain);
    }

    if (savedTimestamp) {
      const timestamp = Number(savedTimestamp);
      const now = Date.now();
      const elapsed = (now - timestamp) / 1000;
      
      if (elapsed < 3600) {
        setEmailTimestamp(timestamp);
        setCanCustomize(true);
      } else {
        setCanCustomize(false);
        setError('Please wait 60 minutes before customizing your email again.');
      }
    }
  }, []);

  useEffect(() => {
    if (emailAddress && emailTimestamp) {
      localStorage.setItem(EMAIL_STORAGE_KEY, emailAddress);
      localStorage.setItem(EMAIL_TIMESTAMP_KEY, String(emailTimestamp));
      localStorage.setItem(DOMAIN_STORAGE_KEY, selectedDomain);
      
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
        email: emailAddress,
        timestamp: emailTimestamp,
        domain: selectedDomain
      }));
      
      const expires = new Date(emailTimestamp + ONE_HOUR);
      document.cookie = `email_timestamp=${emailTimestamp}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
    }
    
    if (emails.length > 0) {
      localStorage.setItem(EMAILS_STORAGE_KEY, JSON.stringify(emails));
    }
  }, [emailAddress, emails, selectedDomain, emailTimestamp]);

  useEffect(() => {
    const startAutoRefresh = () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setInterval(() => {
        debouncedCheckEmails(false);
      }, REFRESH_INTERVAL);
    };

    startAutoRefresh();
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = undefined;
      }
    };
  }, [debouncedCheckEmails]);

  useEffect(() => {
    const initializeEmail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const savedEmail = localStorage.getItem(EMAIL_STORAGE_KEY);
        if (savedEmail) {
          const emailUser = savedEmail.split('@')[0];
          const response = await client.setEmailUser(emailUser);
          setEmailAddress(response.email_addr);
          setNewEmailUser(emailUser);
          setEmailTimestamp(Date.now());
        } else {
          const response = await client.getEmailAddress();
          setEmailAddress(response.email_addr);
          setNewEmailUser(response.email_addr.split('@')[0]);
          setEmailTimestamp(Date.now());
        }
        
        await checkEmails(false);
      } catch (error) {
        console.error('Failed to initialize email:', error);
        setError('Failed to initialize email. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeEmail();
  }, [client, checkEmails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-600">Your temporary email address:</div>
          <div className="flex gap-2 items-center">
            {!canCustomize && (
              <div className="flex items-center text-sm text-amber-600 font-medium">
                <AlertCircle className="w-4 h-4 mr-1" aria-hidden="true" />
                Customization locked
              </div>
            )}
            <button 
              onClick={handleRefresh} 
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:rotate-180" 
              title="Refresh emails"
              aria-label="Refresh emails"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <div className="relative">
              <button 
                onClick={handleCopy} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors" 
                title="Copy email address"
                aria-label="Copy email address to clipboard"
              >
                <Copy className="w-4 h-4" aria-hidden="true" />
              </button>
              {showCopied && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg animate-fade-in-out" role="status">
                  Copied!
                </div>
              )}
            </div>
            <EditButton 
              onClick={() => setIsEditing(true)}
              disabled={!canCustomize || !canChangeEmail()}
            />
          </div>
        </div>
        {isEditing ? (
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="flex-1">
              <label htmlFor="email-username" className="sr-only">Email username</label>
              <div className="flex items-center gap-2">
                <input
                  id="email-username"
                  type="text"
                  value={newEmailUser}
                  onChange={(e) => setNewEmailUser(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new email username"
                  aria-label="New email username"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap" aria-label="Domain">{EMAIL_DOMAINS[selectedDomain]}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="font-mono text-lg mb-2">{getDisplayEmail()}</div>
            <div className="inline-block relative w-64">
              <label htmlFor="domain-select" className="sr-only">Select email domain</label>
              <select
                id="domain-select"
                value={selectedDomain}
                onChange={(e) => handleDomainChange(e.target.value as keyof typeof EMAIL_DOMAINS)}
                className="block w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm"
                aria-label="Email domain"
              >
                {Object.entries(EMAIL_DOMAINS).map(([key, domain]) => (
                  <option key={key} value={key}>
                    {domain}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
              </div>
            </div>
          </>
        )}
        {error && (
          <div className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 h-[600px]">
        <div className="border-r overflow-y-auto">
          {emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Mail className="w-12 h-12 mb-2" />
              <p>No emails yet</p>
              <p className="text-sm text-gray-400 mt-2">Checking for new emails automatically...</p>
            </div>
          ) : (
            <div className="divide-y">
              {emails.map((email) => (
                <button
                  key={email.mail_id}
                  onClick={() => handleEmailClick(email)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedEmail?.mail_id === email.mail_id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-medium truncate flex-1">{email.mail_from}</div>
                    <div className="text-sm text-gray-500 ml-2">{email.mail_date}</div>
                  </div>
                  <div className="text-sm font-medium truncate mb-1">{email.mail_subject}</div>
                  <div className="text-sm text-gray-600 truncate">{email.mail_excerpt}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-y-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }>
            {selectedEmail ? (
              <div className="p-4">
                <div className="mb-4">
                  <div className="font-medium mb-2">{selectedEmail.mail_subject}</div>
                  <div className="text-sm text-gray-600 mb-1">From: {selectedEmail.mail_from}</div>
                  <div className="text-sm text-gray-600">Date: {selectedEmail.mail_date}</div>
                </div>
                {renderEmailContent(selectedEmail.mail_body || '')}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Mail className="w-12 h-12 mb-2" />
                <p>Select an email to read</p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmailBox);