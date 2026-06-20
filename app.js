/* ══════════════════════════════════════════════
   HIREPULSE — Full Stack App.js
   Connects to Spring Boot at localhost:8080
   ══════════════════════════════════════════════ */

const BASE = 'https://hire-production-bb7b.up.railway.app/api';

// ─── AUTH SESSION ────────────────────────────
const S = {
  get token()  { return localStorage.getItem('hp_token'); },
  get role()   { return localStorage.getItem('hp_role'); },
  get name()   { return localStorage.getItem('hp_name'); },
  get email()  { return localStorage.getItem('hp_email'); },
  get userId() { return localStorage.getItem('hp_userId'); },
  get loggedIn(){ return !!this.token; },
  get isAdmin() { return this.role === 'ADMIN'; },
  get isUser()  { return this.role === 'USER'; },
  save(d, email) {
    localStorage.setItem('hp_token',  d.token);
    localStorage.setItem('hp_role',   d.role);
    localStorage.setItem('hp_name',   d.name);
    localStorage.setItem('hp_userId', d.userId);
    if (email) localStorage.setItem('hp_email', email);
  },
  clear() {
    ['hp_token','hp_role','hp_name','hp_userId','hp_email']
      .forEach(k => localStorage.removeItem(k));
  }
};

// ─── API LAYER ───────────────────────────────
const API = {
  h(auth) {
    const h = { 'Content-Type': 'application/json' };
    if (auth && S.token) h['Authorization'] = 'Bearer ' + S.token;
    return h;
  },
  async req(method, path, body, auth) {
    const opts = { method, headers: this.h(auth) };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
    return data;
  },
  get(path, auth=false)       { return this.req('GET',    path, undefined, auth); },
  post(path, body, auth=false){ return this.req('POST',   path, body,      auth); },
  put(path, body, auth=true)  { return this.req('PUT',    path, body,      auth); },
  del(path)                   { return this.req('DELETE', path, undefined, true); },
};

// ─── TOAST ───────────────────────────────────
function toast(msg, type='ok') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<div class="toast-icon">${type==='ok' ? '✓' : '✕'}</div><span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ─── LOADING ─────────────────────────────────
const loading = (msg='Loading...') =>
  `<div class="loading-box"><div class="spinner"></div><span>${msg}</span></div>`;

// ─── EMPTY ───────────────────────────────────
const empty = (title, body, action='') =>
  `<div class="empty-box fade-up"><h3>${title}</h3><p>${body}</p>${action}</div>`;

// ══════════════════════════════════════════════
//   MAIN APP
// ══════════════════════════════════════════════
const App = {
  view: 'home',
  cache: { jobs: [], myApps: [], adminJobs: [] },
  filters: { keyword:'', domain:'', types:[], sortBy:'newest' },
  adminTab: 'applications',

  // ── BOOT ──────────────────────────────────
  async init() {
    this.renderNav();
    await this.go('home');
    // close modals on overlay click
    document.querySelectorAll('.overlay').forEach(ov =>
      ov.addEventListener('click', e => { if (e.target === ov) this.closeModal(ov.id); })
    );
  },

  // ── NAVIGATION ────────────────────────────
  async go(view, data=null) {
    this.view = view;
    this.viewData = data;
    const root = document.getElementById('root');
    root.innerHTML = loading();
    window.scrollTo({ top:0, behavior:'smooth' });
    this.renderNav();

    if (view === 'home')      { await this.pageHome(root); }
    else if (view === 'detail')    { await this.pageDetail(root, data); }
    else if (view === 'dashboard') { await this.pageDashboard(root); }
    else if (view === 'admin')     { await this.pageAdmin(root); }
  },

  // ── HEADER / NAV ──────────────────────────
  renderNav() {
    const list = document.getElementById('nav-list');
    const auth = document.getElementById('nav-auth');

    let links = `<li><span class="nav-link ${this.view==='home'?'active':''}" onclick="App.go('home')">Opportunities</span></li>`;
    if (S.isUser)  links += `<li><span class="nav-link ${this.view==='dashboard'?'active':''}" onclick="App.go('dashboard')">My Dashboard</span></li>`;
    if (S.isAdmin) links += `<li><span class="nav-link ${this.view==='admin'?'active':''}" onclick="App.go('admin')">Admin Console</span></li>`;
    list.innerHTML = links;

    if (S.loggedIn) {
      const initials = (S.name || 'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      auth.innerHTML = `
        <div class="user-chip">
          <div class="user-avatar">${initials}</div>
          <span class="user-name">${S.name}</span>
          <span class="role-pill ${S.isAdmin?'admin':'user'}">${S.role}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.doLogout()">Log out</button>`;
    } else {
      auth.innerHTML = `
        <button class="btn btn-ghost btn-sm" onclick="App.openModal('m-auth');App.authTab('login')">Log In</button>
        <button class="btn btn-primary btn-sm" onclick="App.openModal('m-auth');App.authTab('reg')">Sign Up</button>`;
    }
  },

  // ══════════════════════════════════════════
  //   PAGE: HOME
  // ══════════════════════════════════════════
  async pageHome(root) {
    root.innerHTML = this.tplHome();
    this.bindHomeEvents();
    await this.loadJobs();
  },

  tplHome() {
    return `
    <div class="container">
      <!-- HERO -->
      <div class="hero fade-up">
        <div class="hero-eyebrow">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6"/></svg>
          Jobs &amp; Internships — All in One Place
        </div>
        <h1>Find Your Next<br/><em>Dream Opportunity</em></h1>
        <p>Connecting students and fresh graduates with companies offering jobs and internships across every domain.</p>

        <!-- SEARCH -->
        <div class="search-bar fade-up-2">
          <div class="sf">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input id="s-kw" type="text" placeholder="Title, company or keyword..."/>
          </div>
          <div class="sf">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            <select id="s-domain">
              <option value="">All Domains</option>
              <option>Technology</option><option>Finance</option>
              <option>Marketing</option><option>Design</option>
              <option>Data Science</option><option>Healthcare</option>
              <option>Education</option><option>Engineering</option>
            </select>
          </div>
          <button class="btn btn-primary" id="s-btn">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search
          </button>
        </div>

        <!-- DOMAIN CHIPS -->
        <div class="domain-chips fade-up-3">
          ${['All','Technology','Finance','Design','Marketing','Data Science','Healthcare','Engineering','Education']
            .map(d=>`<div class="domain-chip ${d==='All'?'active':''}" data-domain="${d==='All'?'':d}">${d}</div>`)
            .join('')}
        </div>
      </div>

      <!-- BOARD -->
      <div class="board-layout">
        <!-- SIDEBAR -->
        <aside class="panel sidebar">
          <div class="sidebar-title">Filters</div>
          <div class="filter-block">
            <span class="filter-label">Type</span>
            <label class="cb-row"><input type="checkbox" name="type" value="JOB"/><span class="cb-box"></span>Full-Time Job</label>
            <label class="cb-row"><input type="checkbox" name="type" value="INTERNSHIP"/><span class="cb-box"></span>Internship</label>
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:4px" onclick="App.resetFilters()">Reset Filters</button>
        </aside>

        <!-- LISTINGS -->
        <div>
          <div class="listings-bar">
            <div class="listing-count" id="job-count">Loading...</div>
            <select class="sort-sel" id="sort-sel">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          <div class="listings-stack" id="job-list"></div>
        </div>
      </div>
    </div>`;
  },

  bindHomeEvents() {
    document.getElementById('s-btn').onclick  = () => this.applySearch();
    document.getElementById('s-kw').onkeydown = e => { if(e.key==='Enter') this.applySearch(); };
    document.getElementById('sort-sel').onchange = e => {
      this.filters.sortBy = e.target.value;
      this.renderJobs();
    };
    document.querySelectorAll('.domain-chip').forEach(chip =>
      chip.addEventListener('click', () => {
        document.querySelectorAll('.domain-chip').forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        this.filters.domain = chip.dataset.domain;
        this.loadJobs();
      })
    );
    document.querySelectorAll('input[name="type"]').forEach(cb =>
      cb.addEventListener('change', () => {
        this.filters.types = Array.from(document.querySelectorAll('input[name="type"]:checked')).map(c=>c.value);
        this.renderJobs();
      })
    );
  },

  applySearch() {
    this.filters.keyword = document.getElementById('s-kw').value.trim();
    this.filters.domain  = document.getElementById('s-domain').value;
    // sync domain chip UI
    document.querySelectorAll('.domain-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.domain === this.filters.domain);
    });
    this.loadJobs();
  },

  resetFilters() {
    this.filters = { keyword:'', domain:'', types:[], sortBy:'newest' };
    document.getElementById('s-kw').value = '';
    document.getElementById('s-domain').value = '';
    document.getElementById('sort-sel').value = 'newest';
    document.querySelectorAll('input[name="type"]').forEach(cb=>cb.checked=false);
    document.querySelectorAll('.domain-chip').forEach(c=>c.classList.toggle('active', c.dataset.domain===''));
    this.loadJobs();
  },

  async loadJobs() {
    const list = document.getElementById('job-list');
    if (!list) return;
    list.innerHTML = loading('Fetching opportunities...');

    const params = new URLSearchParams();
    if (this.filters.keyword) params.set('keyword', this.filters.keyword);
    if (this.filters.domain)  params.set('domain',  this.filters.domain);
    const qs = params.toString() ? '?' + params : '';

    try {
      const jobs = await API.get('/jobs' + qs);
      this.cache.jobs = jobs;
      this.renderJobs();
    } catch (err) {
      list.innerHTML = empty(
        'Could not connect',
        'Make sure your Spring Boot backend is running on port 8080. ' + err.message,
        `<button class="btn btn-secondary" onclick="App.loadJobs()">Retry</button>`
      );
      document.getElementById('job-count').innerHTML = '';
    }
  },

  renderJobs() {
    const list  = document.getElementById('job-list');
    const count = document.getElementById('job-count');
    if (!list) return;

    let jobs = [...this.cache.jobs];

    // client-side type filter
    if (this.filters.types.length)
      jobs = jobs.filter(j => this.filters.types.includes(j.type));

    // sort
    if (this.filters.sortBy === 'oldest') jobs.reverse();

    if (count) count.innerHTML = `Found <strong>${jobs.length}</strong> opportunit${jobs.length!==1?'ies':'y'}`;

    if (!jobs.length) {
      list.innerHTML = empty(
        'Nothing found',
        'Try different keywords or remove filters.',
        `<button class="btn btn-secondary" onclick="App.resetFilters()">Reset Filters</button>`
      );
      return;
    }

    list.innerHTML = jobs.map(j => this.tplJobCard(j)).join('');
  },

  tplJobCard(j) {
    const logo = (j.company||'?').slice(0,2).toUpperCase();
    const typeClass = j.type==='INTERNSHIP' ? 'amber' : 'green';
    const typeLabel = j.type==='INTERNSHIP' ? 'Internship' : 'Job';
    const deadline  = j.deadline
      ? new Date(j.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
      : 'Open';
    return `
      <div class="panel jcard fade-up" onclick="App.go('detail',${j.id})">
        <div class="jcard-left">
          <div class="jcard-logo">${logo}</div>
          <div class="jcard-info">
            <h3>${j.title}</h3>
            <div class="jcard-meta">
              <span>${j.company}</span>
              <span>${j.location}</span>
              <span>${j.domain||''}</span>
            </div>
            <div class="tags">
              <span class="tag ${typeClass}">${typeLabel}</span>
              <span class="tag">Deadline: ${deadline}</span>
            </div>
          </div>
        </div>
        <div class="jcard-right">
          <span class="jcard-posted">by ${j.postedByName||'Admin'}</span>
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();App.go('detail',${j.id})">View</button>
        </div>
      </div>`;
  },

  // ══════════════════════════════════════════
  //   PAGE: JOB DETAIL
  // ══════════════════════════════════════════
  async pageDetail(root, jobId) {
    let job;
    try {
      job = await API.get('/jobs/' + jobId);
    } catch(err) {
      root.innerHTML = empty('Job not found', err.message, `<button class="btn btn-secondary" onclick="App.go('home')">Back to listings</button>`);
      return;
    }

    // check if already applied
    let applied = false;
    if (S.isUser) {
      try {
        const myApps = await API.get('/applications/me', true);
        applied = myApps.some(a => a.jobId === job.id);
      } catch(_) {}
    }

    const logo    = (job.company||'?').slice(0,2).toUpperCase();
    const typeLabel = job.type === 'INTERNSHIP' ? 'Internship' : 'Full-Time Job';
    const typeClass = job.type === 'INTERNSHIP' ? 'amber' : 'green';
    const deadline  = job.deadline
      ? new Date(job.deadline).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})
      : 'Open until filled';

    let applyBtn = '';
    if (!S.loggedIn) {
      applyBtn = `<button class="btn btn-primary" style="width:100%" onclick="App.openModal('m-auth');App.authTab('login')">Log in to Apply</button>`;
    } else if (S.isAdmin) {
      applyBtn = `<button class="btn btn-secondary" style="width:100%" disabled>Admins cannot apply</button>`;
    } else if (applied) {
      applyBtn = `<button class="btn btn-secondary" style="width:100%;color:var(--spark)" disabled>&#10003; Already Applied</button>`;
    } else {
      applyBtn = `<button class="btn btn-primary" style="width:100%" onclick="App.openApply(${job.id},'${(job.title+'').replace(/'/g,"\\'")} at ${(job.company+'').replace(/'/g,"\\'")}')">Apply for this Role</button>`;
    }

    root.innerHTML = `
      <div class="container" style="padding-top:36px;padding-bottom:80px">
        <div class="back-btn fade-up" onclick="App.go('home')">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Listings
        </div>
        <div class="detail-layout fade-up">
          <!-- MAIN -->
          <div class="panel detail-main">
            <div class="detail-header">
              <div class="detail-company">
                <div class="detail-logo">${logo}</div>
                <div>
                  <div class="detail-title">${job.title}</div>
                  <div class="detail-sub">${job.company} &middot; ${job.location}</div>
                </div>
              </div>
              <div class="tags" style="margin-top:14px">
                <span class="tag ${typeClass}">${typeLabel}</span>
                <span class="tag blue">${job.domain||''}</span>
                <span class="tag">Deadline: ${deadline}</span>
              </div>
            </div>
            <div class="prose">
              <h2>About This Role</h2>
              <p>${job.description}</p>
              <h2>Posted By</h2>
              <p>${job.postedByName || 'Admin'}</p>
            </div>
          </div>

          <!-- SIDEBAR -->
          <div>
            <div class="panel detail-sidebar" style="margin-bottom:14px">
              <div class="widget">
                <div class="widget-lbl">Opportunity Type</div>
                <div class="widget-val spark">${typeLabel}</div>
              </div>
              <div class="widget">
                <div class="widget-lbl">Location</div>
                <div class="widget-val">${job.location}</div>
              </div>
              <div class="widget">
                <div class="widget-lbl">Domain</div>
                <div class="widget-val">${job.domain||'—'}</div>
              </div>
              <div class="widget">
                <div class="widget-lbl">Application Deadline</div>
                <div class="widget-val">${deadline}</div>
              </div>
              <div class="widget">
                <div class="widget-lbl">Posted By</div>
                <div class="widget-val">${job.postedByName||'Admin'}</div>
              </div>
            </div>
            ${applyBtn}
          </div>
        </div>
      </div>`;
  },

  // ══════════════════════════════════════════
  //   PAGE: USER DASHBOARD
  // ══════════════════════════════════════════
  async pageDashboard(root) {
    if (!S.loggedIn) {
      root.innerHTML = empty('Login Required', 'Please log in to view your dashboard.',
        `<button class="btn btn-primary" onclick="App.openModal('m-auth')">Log In</button>`);
      return;
    }
    if (!S.isUser) {
      root.innerHTML = empty('Not Accessible', 'This page is for job seekers only.');
      return;
    }

    let apps = [];
    try {
      apps = await API.get('/applications/me', true);
      this.cache.myApps = apps;
    } catch(err) {
      root.innerHTML = empty('Error loading data', err.message,
        `<button class="btn btn-secondary" onclick="App.go('dashboard')">Retry</button>`);
      return;
    }

    const initials = (S.name||'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
    const counts = {
      total:    apps.length,
      pending:  apps.filter(a=>a.status==='PENDING').length,
      reviewed: apps.filter(a=>a.status==='REVIEWED').length,
      accepted: apps.filter(a=>a.status==='ACCEPTED').length,
    };

    root.innerHTML = `
      <div class="container" style="padding-top:36px">
        <div class="dash-layout">
          <!-- PROFILE -->
          <div>
            <div class="panel profile-card fade-up" style="margin-bottom:14px">
              <div class="profile-ava">${initials}</div>
              <div class="profile-name">${S.name}</div>
              <div class="profile-email">${S.email||'—'}</div>
              <div class="profile-stats">
                <div class="pstat"><div class="pstat-n">${counts.total}</div><div class="pstat-l">Applied</div></div>
                <div class="pstat"><div class="pstat-n">${counts.reviewed}</div><div class="pstat-l">Reviewed</div></div>
                <div class="pstat"><div class="pstat-n">${counts.accepted}</div><div class="pstat-l">Accepted</div></div>
              </div>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="App.go('home')">Browse More Jobs</button>
          </div>

          <!-- APPLICATIONS -->
          <div class="fade-up-2">
            <div class="dash-main-title">
              My Applications
              <span>${apps.length} total</span>
            </div>
            ${apps.length === 0
              ? empty('No applications yet',
                  'You haven\'t applied anywhere. Start exploring opportunities!',
                  `<button class="btn btn-primary" onclick="App.go('home')">Explore Now</button>`)
              : apps.map(a => this.tplAppCard(a)).join('')
            }
          </div>
        </div>
      </div>`;
  },

  tplAppCard(a) {
    const status = (a.status||'PENDING').toLowerCase();
    const statusMap = { pending:0, reviewed:1, accepted:3, rejected:3 };
    const idx = statusMap[status] ?? 0;
    const isRejected = status === 'rejected';
    const pct = { pending:'0%', reviewed:'33%', accepted:'100%', rejected:'100%' }[status] || '0%';

    const steps = ['Applied','Reviewed','Interview','Decision'];
    const stepsHTML = steps.map((label,i) => {
      let cls = '', dot = i+1;
      if (i===3) {
        if (isRejected)          { cls='fail'; label='Rejected'; dot='✕'; }
        else if (status==='accepted') { cls='done'; label='Accepted!'; dot='✓'; }
      } else {
        if (i < idx) cls='done';
        else if (i === idx) cls='now';
      }
      return `<div class="track-step">
        <div class="step-dot ${cls}">${dot}</div>
        <div class="step-lbl ${cls}">${label}</div>
      </div>`;
    }).join('');

    const date = a.appliedAt
      ? new Date(a.appliedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
      : '—';

    const spill = `sp-${status}`;

    return `
      <div class="panel app-card fade-up" style="margin-bottom:14px">
        <div class="app-card-top">
          <div>
            <div class="app-job-title">${a.jobTitle}</div>
            <div class="app-company">${a.company} &middot; Applied ${date}</div>
          </div>
          <span class="status-pill ${spill}">${a.status}</span>
        </div>
        ${a.coverLetter ? `<div style="font-size:.85rem;color:var(--muted);margin-bottom:12px;padding:10px 14px;background:var(--ink-3);border-radius:var(--r-sm);border-left:3px solid var(--spark)">"${a.coverLetter}"</div>` : ''}
        <div class="track">
          <div class="track-line"></div>
          <div class="track-fill" style="width:${pct};${isRejected?'background:var(--rose)':''}"></div>
          ${stepsHTML}
        </div>
      </div>`;
  },

  // ══════════════════════════════════════════
  //   PAGE: ADMIN DASHBOARD
  // ══════════════════════════════════════════
  async pageAdmin(root) {
    if (!S.isAdmin) {
      root.innerHTML = empty('Access Denied', 'This page is for admins only.');
      return;
    }

    let jobs = [], allApps = [];
    try {
      jobs = await API.get('/admin/jobs', true);
      this.cache.adminJobs = jobs;
    } catch(err) {
      root.innerHTML = empty('Error', 'Could not load admin data: ' + err.message,
        `<button class="btn btn-secondary" onclick="App.go('admin')">Retry</button>`);
      return;
    }

    // fetch applications per job
    for (const j of jobs) {
      try {
        const apps = await API.get(`/admin/jobs/${j.id}/applications`, true);
        allApps = allApps.concat(apps);
      } catch(_) {}
    }

    const stats = {
      jobs:     jobs.length,
      apps:     allApps.length,
      pending:  allApps.filter(a=>a.status==='PENDING').length,
      accepted: allApps.filter(a=>a.status==='ACCEPTED').length,
    };

    root.innerHTML = `
      <div class="container" style="padding-top:36px;padding-bottom:80px">
        <div class="admin-hero fade-up">
          <h1>Admin Console</h1>
          <p>Manage your job listings and review applications all in one place.</p>
        </div>

        <!-- STATS -->
        <div class="stats-row fade-up-2">
          <div class="panel stat-card">
            <div class="stat-icon si-green">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div><div class="stat-n">${stats.jobs}</div><div class="stat-l">Active Listings</div></div>
          </div>
          <div class="panel stat-card">
            <div class="stat-icon si-blue">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div><div class="stat-n">${stats.apps}</div><div class="stat-l">Total Applications</div></div>
          </div>
          <div class="panel stat-card">
            <div class="stat-icon si-amber">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div><div class="stat-n">${stats.pending}</div><div class="stat-l">Pending Review</div></div>
          </div>
          <div class="panel stat-card">
            <div class="stat-icon si-rose">
              <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div><div class="stat-n">${stats.accepted}</div><div class="stat-l">Accepted</div></div>
          </div>
        </div>

        <!-- TABS -->
        <div class="tab-bar fade-up-3">
          <div class="tab ${this.adminTab==='applications'?'active':''}" onclick="App.setAdminTab('applications')">Applications (${stats.apps})</div>
          <div class="tab ${this.adminTab==='jobs'?'active':''}" onclick="App.setAdminTab('jobs')">My Listings (${stats.jobs})</div>
        </div>

        <!-- TAB CONTENT -->
        <div id="admin-tab-content">
          ${this.adminTab === 'applications'
            ? this.tplAdminApps(allApps)
            : this.tplAdminJobs(jobs)
          }
        </div>
      </div>`;
  },

  tplAdminApps(apps) {
    if (!apps.length) return empty('No applications yet', 'Once users apply to your listings they will appear here.');
    return `
      <div class="tbl-wrap fade-up">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Applied For</th>
              <th>Resume</th>
              <th>Cover Letter</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${apps.map(a => `
              <tr>
                <td>
                  <div class="cand-cell">
                    <div class="cand-av">${(a.applicantName||'?')[0]}</div>
                    <div>
                      <div class="cand-name">${a.applicantName}</div>
                      <div class="cand-email">${a.applicantEmail}</div>
                    </div>
                  </div>
                </td>
                <td style="font-weight:600;color:var(--bright)">${a.jobTitle}<br/><span style="font-size:.78rem;color:var(--muted);font-weight:400">${a.company}</span></td>
                <td>${a.resumeUrl
                  ? `<a href="${a.resumeUrl}" target="_blank" style="color:var(--blue);text-decoration:underline;font-size:.85rem">View Resume</a>`
                  : '<span style="color:var(--muted);font-size:.82rem">—</span>'}</td>
                <td style="max-width:220px">
                  <div style="font-size:.82rem;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px" title="${(a.coverLetter||'').replace(/"/g,'&quot;')}">
                    ${a.coverLetter || '<em>None provided</em>'}
                  </div>
                </td>
                <td>
                  <select class="status-sel" onchange="App.updateStatus(${a.id},this.value)">
                    <option value="PENDING"  ${a.status==='PENDING' ?'selected':''}>Pending</option>
                    <option value="REVIEWED" ${a.status==='REVIEWED'?'selected':''}>Reviewed</option>
                    <option value="ACCEPTED" ${a.status==='ACCEPTED'?'selected':''}>Accepted</option>
                    <option value="REJECTED" ${a.status==='REJECTED'?'selected':''}>Rejected</option>
                  </select>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  },

  tplAdminJobs(jobs) {
    return `
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px" class="fade-up">
        <button class="btn btn-primary" onclick="App.openCreateJob()">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Post New Opportunity
        </button>
      </div>
      ${!jobs.length
        ? empty('No listings yet', 'Post your first opportunity to start receiving applications.')
        : `<div class="tbl-wrap fade-up">
            <table>
              <thead>
                <tr>
                  <th>Title</th><th>Company</th><th>Type</th><th>Location</th><th>Domain</th><th>Deadline</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${jobs.map(j=>`
                  <tr>
                    <td style="font-weight:600;color:var(--bright)">${j.title}</td>
                    <td style="color:var(--spark)">${j.company}</td>
                    <td><span class="tag ${j.type==='INTERNSHIP'?'amber':'green'}" style="font-size:.75rem">${j.type}</span></td>
                    <td>${j.location}</td>
                    <td>${j.domain||'—'}</td>
                    <td>${j.deadline?new Date(j.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'Open'}</td>
                    <td>
                      <div style="display:flex;gap:8px">
                        <button class="btn btn-secondary btn-sm" onclick="App.openEditJob(${j.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteJob(${j.id})">Delete</button>
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`}`;
  },

  setAdminTab(tab) {
    this.adminTab = tab;
    this.go('admin');
  },

  // ══════════════════════════════════════════
  //   AUTH ACTIONS
  // ══════════════════════════════════════════
  async doLogin(e) {
    e.preventDefault();
    const email = document.getElementById('li-email').value.trim();
    const password = document.getElementById('li-pass').value;
    try {
      const data = await API.post('/auth/login', { email, password });
      S.save(data, email);
      this.closeModal('m-auth');
      document.getElementById('f-login').reset();
      toast(`Welcome back, ${data.name}!`);
      data.role === 'ADMIN' ? this.go('admin') : this.go('dashboard');
    } catch(err) {
      toast(err.message || 'Invalid credentials', 'err');
    }
  },

  async doRegister(e) {
    e.preventDefault();
    const name     = document.getElementById('rg-name').value.trim();
    const email    = document.getElementById('rg-email').value.trim();
    const password = document.getElementById('rg-pass').value;
    const role     = document.getElementById('rg-role').value;
    if (password.length < 6) { toast('Password must be at least 6 characters', 'err'); return; }
    try {
      const data = await API.post('/auth/register', { name, email, password, role });
      S.save(data, email);
      this.closeModal('m-auth');
      document.getElementById('f-reg').reset();
      toast(`Account created! Welcome, ${data.name}.`);
      data.role === 'ADMIN' ? this.go('admin') : this.go('dashboard');
    } catch(err) {
      toast(err.message || 'Registration failed', 'err');
    }
  },

  doLogout() {
    S.clear();
    toast('Logged out successfully');
    this.go('home');
  },

  // ══════════════════════════════════════════
  //   APPLICATION ACTIONS
  // ══════════════════════════════════════════
  openApply(jobId, label) {
    if (!S.loggedIn) { this.openModal('m-auth'); return; }
    document.getElementById('apply-jid').value       = jobId;
    document.getElementById('apply-job-label').textContent = label;
    document.getElementById('ap-resume').value  = '';
    document.getElementById('ap-letter').value  = '';
    this.openModal('m-apply');
  },

  async doApply(e) {
    e.preventDefault();
    const jobId       = parseInt(document.getElementById('apply-jid').value);
    const resumeUrl   = document.getElementById('ap-resume').value.trim();
    const coverLetter = document.getElementById('ap-letter').value.trim();
    try {
      await API.post('/applications', { jobId, resumeUrl, coverLetter }, true);
      this.closeModal('m-apply');
      toast('Application submitted successfully!');
      this.go('dashboard');
    } catch(err) {
      toast(err.message || 'Could not submit application', 'err');
    }
  },

  // ══════════════════════════════════════════
  //   ADMIN JOB ACTIONS
  // ══════════════════════════════════════════
  openCreateJob() {
    document.getElementById('job-modal-title').textContent = 'Post New Opportunity';
    document.getElementById('job-submit-btn').textContent  = 'Publish Opportunity';
    document.getElementById('job-edit-id').value = '';
    document.getElementById('f-job').reset();
    this.openModal('m-job');
  },

  openEditJob(jobId) {
    const job = this.cache.adminJobs.find(j => j.id === jobId);
    if (!job) { toast('Job not found in cache', 'err'); return; }
    document.getElementById('job-modal-title').textContent = 'Edit Opportunity';
    document.getElementById('job-submit-btn').textContent  = 'Save Changes';
    document.getElementById('job-edit-id').value   = job.id;
    document.getElementById('jb-title').value      = job.title;
    document.getElementById('jb-company').value    = job.company;
    document.getElementById('jb-type').value       = job.type;
    document.getElementById('jb-domain').value     = job.domain;
    document.getElementById('jb-location').value   = job.location;
    document.getElementById('jb-deadline').value   = job.deadline || '';
    document.getElementById('jb-desc').value       = job.description;
    this.openModal('m-job');
  },

  async doSaveJob(e) {
    e.preventDefault();
    const editId = document.getElementById('job-edit-id').value;
    const body = {
      title:       document.getElementById('jb-title').value.trim(),
      company:     document.getElementById('jb-company').value.trim(),
      type:        document.getElementById('jb-type').value,
      domain:      document.getElementById('jb-domain').value,
      location:    document.getElementById('jb-location').value.trim(),
      deadline:    document.getElementById('jb-deadline').value || null,
      description: document.getElementById('jb-desc').value.trim(),
    };
    try {
      if (editId) {
        await API.put('/admin/jobs/' + editId, body, true);
        toast('Listing updated successfully!');
      } else {
        await API.post('/admin/jobs', body, true);
        toast('Opportunity published!');
      }
      this.closeModal('m-job');
      this.go('admin');
    } catch(err) {
      toast(err.message || 'Could not save listing', 'err');
    }
  },

  async deleteJob(jobId) {
    if (!confirm('Delete this listing? All its applications will also be removed.')) return;
    try {
      await API.del('/admin/jobs/' + jobId);
      toast('Listing deleted');
      this.go('admin');
    } catch(err) {
      toast(err.message || 'Delete failed', 'err');
    }
  },

  async updateStatus(appId, status) {
    try {
      await API.put(`/admin/applications/${appId}/status?status=${status}`, null, true);
      toast(`Status updated to ${status}`);
      // refresh admin page quietly
      const jobs = await API.get('/admin/jobs', true);
      this.cache.adminJobs = jobs;
      let allApps = [];
      for (const j of jobs) {
        try {
          const apps = await API.get(`/admin/jobs/${j.id}/applications`, true);
          allApps = allApps.concat(apps);
        } catch(_) {}
      }
      const content = document.getElementById('admin-tab-content');
      if (content && this.adminTab === 'applications') {
        content.innerHTML = this.tplAdminApps(allApps);
      }
    } catch(err) {
      toast(err.message || 'Status update failed', 'err');
    }
  },

  // ══════════════════════════════════════════
  //   MODAL UTILS
  // ══════════════════════════════════════════
  openModal(id)  { document.getElementById(id).classList.add('open'); },
  closeModal(id) { document.getElementById(id).classList.remove('open'); },

  authTab(tab) {
    const showLogin = tab === 'login';
    document.getElementById('tab-login').classList.toggle('active', showLogin);
    document.getElementById('tab-reg').classList.toggle('active', !showLogin);
    document.getElementById('f-login').style.display = showLogin ? 'block' : 'none';
    document.getElementById('f-reg').style.display   = showLogin ? 'none'  : 'block';
  },
};

window.addEventListener('DOMContentLoaded', () => App.init());
