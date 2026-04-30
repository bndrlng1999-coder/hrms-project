import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { internalMailAPI } from '../services/api';
import { useNotification } from '../hooks/useNotification';

const emptyCompose = {
  to: [],
  cc: [],
  bcc: [],
  subject: '',
  body: '',
};

const InternalMailPage = ({ view }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const [summary, setSummary] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(emptyCompose);
  const [files, setFiles] = useState([]);
  const [contactText, setContactText] = useState('');
  const [filter, setFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingAction, setSubmittingAction] = useState('');

  useEffect(() => {
    loadCommon();
  }, []);

  useEffect(() => {
    if (view === 'message' && id) {
      loadMessage(id);
    } else if (view !== 'compose') {
      loadList();
    } else {
      setLoading(false);
    }
  }, [view, id, filter]);

  const loadCommon = async () => {
    try {
      const [summaryRes, contactsRes] = await Promise.all([
        internalMailAPI.getSummary(),
        internalMailAPI.getContacts(),
      ]);
      setSummary(summaryRes.data.data);
      setContacts(contactsRes.data.data || []);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load Internal Mail');
    }
  };

  const loadList = async () => {
    try {
      setLoading(true);
      let response;
      if (view === 'sent') response = await internalMailAPI.getSent();
      else if (view === 'drafts') response = await internalMailAPI.getDrafts();
      else if (view === 'trash') response = await internalMailAPI.getTrash();
      else if (view === 'starred') response = await internalMailAPI.getStarred();
      else response = await internalMailAPI.getInbox(filter ? { filter } : {});
      setMessages(response.data.data || []);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load mail');
    } finally {
      setLoading(false);
    }
  };

  const loadMessage = async (messageId) => {
    try {
      setLoading(true);
      const response = await internalMailAPI.getMessage(messageId);
      setMessage(response.data.data);
      loadCommon();
    } catch (error) {
      showError(error.response?.data?.message || 'Mail not found');
      navigate('/mail/inbox');
    } finally {
      setLoading(false);
    }
  };

  const visibleMessages = useMemo(() => {
    const start = dateFilter ? new Date(dateFilter) : null;
    return messages.filter((item) => {
      if (!start) return true;
      return new Date(item.createdAt || item.updatedAt) >= start;
    });
  }, [messages, dateFilter]);

  const searchMail = async (e) => {
    e.preventDefault();
    if (submittingAction === 'search') return;
    if (!query.trim()) {
      loadList();
      return;
    }
    try {
      setSubmittingAction('search');
      setLoading(true);
      const response = await internalMailAPI.search(query.trim());
      setMessages(response.data.data || []);
    } catch (error) {
      showError('Search failed');
    } finally {
      setLoading(false);
      setSubmittingAction('');
    }
  };

  const sendMail = async (payload = form) => {
    if (submittingAction) return;
    try {
      setSubmittingAction('send');
      await internalMailAPI.compose(payload, files);
      showSuccess('Internal mail sent');
      setForm(emptyCompose);
      setFiles([]);
      navigate('/mail/sent');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to send mail');
    } finally {
      setSubmittingAction('');
    }
  };

  const saveDraft = async () => {
    if (submittingAction) return;
    try {
      setSubmittingAction('draft');
      await internalMailAPI.saveDraft(form);
      showSuccess('Draft saved');
      navigate('/mail/drafts');
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setSubmittingAction('');
    }
  };

  const addRecipient = (field = 'to') => {
    const match = contacts.find((contact) => `${contact.displayName} <${contact.emailAddress}>` === contactText || contact.emailAddress === contactText);
    if (!match || form[field].includes(match.id)) return;
    setForm({ ...form, [field]: [...form[field], match.id] });
    setContactText('');
  };

  const removeRecipient = (field, contactId) => {
    setForm({ ...form, [field]: form[field].filter((value) => value !== contactId) });
  };

  const action = async (fn, success) => {
    if (submittingAction) return;
    try {
      setSubmittingAction('message-action');
      await fn();
      showSuccess(success);
      if (view === 'message') loadMessage(id);
      else loadList();
    } catch (error) {
      showError(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmittingAction('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20 lg:ml-64 lg:p-8 lg:pt-24">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary-600">Internal Mail</p>
          <h1 className="text-3xl font-bold text-gray-900">{titleFor(view)}</h1>
          {summary && <p className="mt-1 text-sm text-gray-500">{summary.emailAddress} - {summary.unreadCount} unread</p>}
        </div>
        <form onSubmit={searchMail} className="flex w-full max-w-xl gap-2">
          <input className="input-field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search internal mail" />
          <button className="btn btn-primary" type="submit" disabled={submittingAction === 'search'}>{submittingAction === 'search' ? 'Searching...' : 'Search'}</button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_1fr]">
        <MailSidebar unreadCount={summary?.unreadCount || 0} />
        <div className="min-w-0">
          {view === 'compose' && (
            <ComposeForm
              contacts={contacts}
              form={form}
              setForm={setForm}
              files={files}
              setFiles={setFiles}
              contactText={contactText}
              setContactText={setContactText}
              addRecipient={addRecipient}
              removeRecipient={removeRecipient}
              onSend={() => sendMail()}
              onDraft={saveDraft}
              submitting={submittingAction}
            />
          )}

          {view === 'message' && message && (
            <MessageDetail
              message={message}
              contacts={contacts}
              onBack={() => navigate('/mail/inbox')}
              onUnread={() => action(() => internalMailAPI.markUnread(message.id), 'Marked unread')}
              onStar={() => action(() => internalMailAPI.toggleStar(message.id), 'Star updated')}
              onImportant={() => action(() => internalMailAPI.toggleImportant(message.id), 'Importance updated')}
              onDelete={() => action(() => internalMailAPI.delete(message.id), 'Moved to trash')}
              onReply={(body) => action(() => internalMailAPI.reply(message.id, { subject: `Re: ${message.subject}`, body }), 'Reply sent')}
              onForward={(payload) => action(() => internalMailAPI.forward(message.id, payload), 'Mail forwarded')}
            />
          )}

          {view !== 'compose' && view !== 'message' && (
            <>
              <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {view === 'inbox' && (
                    <>
                      <FilterButton active={!filter} label="All" onClick={() => setFilter('')} />
                      <FilterButton active={filter === 'unread'} label="Unread" onClick={() => setFilter('unread')} />
                      <FilterButton active={filter === 'starred'} label="Starred" onClick={() => setFilter('starred')} />
                      <FilterButton active={filter === 'important'} label="Important" onClick={() => setFilter('important')} />
                    </>
                  )}
                </div>
                <input className="input-field md:max-w-xs" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
              </div>
              {loading ? <div className="card">Loading mail...</div> : <MailList messages={visibleMessages} view={view} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MailSidebar = ({ unreadCount }) => {
  const items = [
    ['/mail/compose', 'Compose', 'CM'],
    ['/mail/inbox', `Inbox${unreadCount ? ` (${unreadCount})` : ''}`, 'IN'],
    ['/mail/sent', 'Sent', 'SE'],
    ['/mail/drafts', 'Drafts', 'DR'],
    ['/mail/starred', 'Starred', 'ST'],
    ['/mail/trash', 'Trash', 'TR'],
  ];
  return (
    <div className="h-fit rounded-lg border border-gray-200 bg-white p-3">
      <nav className="space-y-2">
        {items.map(([path, label, icon]) => (
          <Link key={path} to={path} className="flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-primary-50 hover:text-primary-700">
            <span className="mr-3 text-xs font-bold text-primary-600">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

const MailList = ({ messages, view }) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    {messages.length === 0 ? (
      <div className="p-10 text-center text-gray-500">No internal mail here yet.</div>
    ) : messages.map((message) => (
      <Link
        key={`${message.folder}-${message.id}`}
        to={view === 'drafts' ? '/mail/compose' : `/mail/message/${message.id}`}
        className={`grid gap-3 border-b border-gray-100 p-4 hover:bg-primary-50 md:grid-cols-[180px_1fr_150px] ${message.read === false ? 'bg-blue-50 font-semibold' : 'bg-white'}`}
      >
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-900">{view === 'sent' ? message.toNames || 'Recipients' : message.senderName || 'Draft'}</p>
          <p className="truncate text-xs text-gray-500">{message.senderEmail || message.folder}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-gray-900">{message.starred ? '* ' : ''}{message.important ? '! ' : ''}{message.subject || '(No subject)'}</p>
          <p className="truncate text-sm text-gray-500">{message.preview}</p>
        </div>
        <div className="text-sm text-gray-500 md:text-right">{formatDate(message.createdAt || message.updatedAt)}</div>
      </Link>
    ))}
  </div>
);

const ComposeForm = ({ contacts, form, setForm, files, setFiles, contactText, setContactText, addRecipient, removeRecipient, onSend, onDraft, submitting }) => (
  <div className="card">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold">Compose Mail</h2>
      <div className="flex gap-2">
        <button type="button" onClick={onDraft} disabled={Boolean(submitting)} className="btn btn-secondary">
          {submitting === 'draft' ? 'Saving...' : 'Save Draft'}
        </button>
        <button type="button" onClick={onSend} disabled={Boolean(submitting)} className="btn btn-primary">
          {submitting === 'send' ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>

    <RecipientPicker
      label="To"
      field="to"
      contacts={contacts}
      values={form.to}
      contactText={contactText}
      setContactText={setContactText}
      addRecipient={addRecipient}
      removeRecipient={removeRecipient}
    />

    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <RecipientPicker label="Cc" field="cc" contacts={contacts} values={form.cc} contactText={contactText} setContactText={setContactText} addRecipient={addRecipient} removeRecipient={removeRecipient} compact />
      <RecipientPicker label="Bcc" field="bcc" contacts={contacts} values={form.bcc} contactText={contactText} setContactText={setContactText} addRecipient={addRecipient} removeRecipient={removeRecipient} compact />
    </div>

    <input className="input-field mt-4" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
    <RichEditor value={form.body} onChange={(body) => setForm({ ...form, body })} />
    <div className="mt-4">
      <input className="input-field" type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
      {files.length > 0 && <p className="mt-2 text-sm text-gray-500">{files.length} attachment(s) selected</p>}
    </div>
  </div>
);

const RecipientPicker = ({ label, field, contacts, values, contactText, setContactText, addRecipient, removeRecipient, compact }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
    <div className="flex gap-2">
      <input
        className="input-field"
        list="internal-mail-contacts"
        value={contactText}
        onChange={(e) => setContactText(e.target.value)}
        placeholder="Type a name or @tanvox.local address"
      />
      <button type="button" className="btn btn-secondary" onClick={() => addRecipient(field)}>Add</button>
    </div>
    <datalist id="internal-mail-contacts">
      {contacts.map((contact) => <option key={contact.id} value={`${contact.displayName} <${contact.emailAddress}>`} />)}
    </datalist>
    {!compact && <RecipientChips contacts={contacts} values={values} field={field} removeRecipient={removeRecipient} />}
    {compact && <RecipientChips contacts={contacts} values={values} field={field} removeRecipient={removeRecipient} small />}
  </div>
);

const RecipientChips = ({ contacts, values, field, removeRecipient, small }) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {values.map((value) => {
      const contact = contacts.find((item) => item.id === value);
      return (
        <button key={value} type="button" onClick={() => removeRecipient(field, value)} className={`rounded-full bg-primary-50 px-3 py-1 text-primary-700 ${small ? 'text-xs' : 'text-sm'}`}>
          {contact?.displayName || value} x
        </button>
      );
    })}
  </div>
);

const RichEditor = ({ value, onChange }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      className="mt-4 min-h-[240px] rounded-lg border border-gray-300 bg-white p-4 text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
    />
  );
};

const MessageDetail = ({ message, onBack, onUnread, onStar, onImportant, onDelete, onReply, onForward }) => {
  const [replyBody, setReplyBody] = useState('');
  const [forwardTo, setForwardTo] = useState('');

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={onBack} className="btn btn-secondary">Back</button>
          <button type="button" onClick={onUnread} className="btn btn-secondary">Unread</button>
          <button type="button" onClick={onStar} className="btn btn-secondary">Star</button>
          <button type="button" onClick={onImportant} className="btn btn-secondary">Important</button>
          <button type="button" onClick={onDelete} className="btn btn-danger">Trash</button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{message.subject}</h2>
        <p className="mt-2 text-sm text-gray-500">From {message.senderName} &lt;{message.senderEmail}&gt; - {formatDate(message.createdAt)}</p>
        <div className="mt-2 text-sm text-gray-500">To {(message.recipients || []).map((item) => `${item.displayName} (${item.type})`).join(', ')}</div>
        <div className="prose mt-6 max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: message.body || '' }} />
        {(message.attachments || []).length > 0 && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="font-semibold">Attachments</p>
            {(message.attachments || []).map((attachment) => (
              <p key={attachment.id} className="text-sm text-gray-600">{attachment.fileName} ({attachment.fileSize || 0} bytes)</p>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-lg font-bold">Reply</h3>
          <textarea className="input-field min-h-[140px]" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
          <button type="button" onClick={() => onReply(replyBody)} className="btn btn-primary mt-3">Send Reply</button>
        </div>
        <div className="card">
          <h3 className="mb-3 text-lg font-bold">Forward</h3>
          <input className="input-field" placeholder="Recipient mailbox id or address" value={forwardTo} onChange={(e) => setForwardTo(e.target.value)} />
          <button type="button" onClick={() => onForward({ to: [forwardTo], subject: `Fwd: ${message.subject}`, body: '' })} className="btn btn-primary mt-3">Forward</button>
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ active, label, onClick }) => (
  <button type="button" onClick={onClick} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-primary-50'}`}>
    {label}
  </button>
);

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString();
};

const titleFor = (view) => ({
  inbox: 'Inbox',
  sent: 'Sent Mail',
  drafts: 'Drafts',
  trash: 'Trash',
  starred: 'Starred',
  compose: 'Compose Mail',
  message: 'Message',
}[view] || 'Internal Mail');

export default InternalMailPage;
