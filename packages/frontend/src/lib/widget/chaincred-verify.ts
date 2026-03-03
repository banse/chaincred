/**
 * PRD 8.3 — Verification Widget
 *
 * <chaincred-verify wallet="0x..." min-score="500" required-badges="builder,governor" />
 *
 * Standalone Web Component with Shadow DOM — no SvelteKit/Tailwind dependency.
 */

const STYLES = `
  :host {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 360px;
  }
  .card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }
  .logo {
    font-weight: 700;
    font-size: 14px;
    color: #4f46e5;
  }
  .status {
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 9999px;
  }
  .pass { background: #dcfce7; color: #166534; }
  .fail { background: #fef2f2; color: #991b1b; }
  .score-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }
  .score-value {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
  }
  .score-max {
    font-size: 14px;
    color: #94a3b8;
  }
  .confidence {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 12px;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 9999px;
    border: 1px solid #e2e8f0;
    color: #475569;
  }
  .badge.earned { background: #ede9fe; border-color: #c4b5fd; color: #5b21b6; }
  .badge.missing { background: #f8fafc; color: #cbd5e1; border-color: #e2e8f0; }
  .wallet {
    font-size: 11px;
    color: #94a3b8;
    word-break: break-all;
  }
  .loading {
    text-align: center;
    padding: 24px;
    color: #94a3b8;
    font-size: 14px;
  }
  .error {
    text-align: center;
    padding: 24px;
    color: #ef4444;
    font-size: 14px;
  }
  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid #e2e8f0;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

class ChainCredVerify extends HTMLElement {
  static get observedAttributes() {
    return ['wallet', 'min-score', 'required-badges', 'api-url'];
  }

  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  private get apiUrl(): string {
    return this.getAttribute('api-url') || 'http://localhost:3001/v1';
  }

  private get wallet(): string {
    return this.getAttribute('wallet') || '';
  }

  private get minScore(): number {
    return parseInt(this.getAttribute('min-score') || '0', 10);
  }

  private get requiredBadges(): string[] {
    const attr = this.getAttribute('required-badges');
    return attr ? attr.split(',').map((b) => b.trim()).filter(Boolean) : [];
  }

  private async render() {
    if (!this.wallet) {
      this.shadow.innerHTML = `<style>${STYLES}</style><div class="card error">No wallet address provided</div>`;
      return;
    }

    // Loading state
    this.shadow.innerHTML = `<style>${STYLES}</style><div class="card loading"><div class="spinner"></div><div style="margin-top:8px">Verifying...</div></div>`;

    try {
      const [scoreRes, badgesRes] = await Promise.all([
        fetch(`${this.apiUrl}/score/${this.wallet}`),
        fetch(`${this.apiUrl}/badges/${this.wallet}`),
      ]);

      if (!scoreRes.ok || !badgesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const score = await scoreRes.json();
      const badgesData = await badgesRes.json();

      const meetsScore = score.totalScore >= this.minScore;
      const earnedBadgeTypes = new Set(
        (badgesData.badges || []).filter((b: any) => b.earned).map((b: any) => b.type),
      );
      const meetsBadges = this.requiredBadges.every((b) => earnedBadgeTypes.has(b));
      const passed = meetsScore && meetsBadges;

      const badgeChips = (badgesData.badges || [])
        .map((b: any) => {
          const isRequired = this.requiredBadges.includes(b.type);
          const cls = b.earned ? 'earned' : 'missing';
          if (!isRequired && !b.earned) return '';
          return `<span class="badge ${cls}">${b.type}</span>`;
        })
        .filter(Boolean)
        .join('');

      const confidencePercent = Math.round(score.sybilMultiplier * 100);

      this.shadow.innerHTML = `
        <style>${STYLES}</style>
        <div class="card">
          <div class="header">
            <span class="logo">ChainCred</span>
            <span class="status ${passed ? 'pass' : 'fail'}">${passed ? 'PASS' : 'FAIL'}</span>
          </div>
          <div class="score-row">
            <span class="score-value">${score.totalScore}</span>
            <span class="score-max">/ 1000${this.minScore > 0 ? ` (min: ${this.minScore})` : ''}</span>
          </div>
          <div class="confidence">Sybil confidence: ${confidencePercent}%</div>
          ${badgeChips ? `<div class="badges">${badgeChips}</div>` : ''}
          <div class="wallet">${this.wallet}</div>
        </div>
      `;
    } catch {
      this.shadow.innerHTML = `<style>${STYLES}</style><div class="card error">Unable to verify wallet</div>`;
    }
  }
}

if (!customElements.get('chaincred-verify')) {
  customElements.define('chaincred-verify', ChainCredVerify);
}

export { ChainCredVerify };
