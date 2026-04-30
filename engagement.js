/**
 * JWAY Engagement Script
 * 1) 도구 사용 기록 (LocalStorage)
 * 2) 결과 페이지 하단에 "다음 추천 도구" 배너
 * 3) URL 공유 버튼
 */
(function() {
  'use strict';

  // === 도구 메타 정보 ===
  const TOOLS = {
    'char-counter':         {name:'글자수 세기', icon:'✏️', color:'#2D5BE3'},
    'date-calculator':      {name:'날짜 계산기', icon:'📅', color:'#6C5CE7'},
    'percent-calculator':   {name:'퍼센트 계산기', icon:'🔢', color:'#2E8B57'},
    'salary-calculator':    {name:'연봉 실수령액', icon:'💰', color:'#3366FF'},
    'bmi-calculator':       {name:'BMI 계산기', icon:'🏃', color:'#059669'},
    'exchange-rate':        {name:'환율 계산기', icon:'💱', color:'#D97706'},
    'unit-converter':       {name:'단위 변환기', icon:'📏', color:'#0891B2'},
    'timer':                {name:'온라인 타이머', icon:'⏱️', color:'#E34040'},
    'qr-generator':         {name:'QR코드 생성기', icon:'📱', color:'#7C3AED'},
    'color-converter':      {name:'색상 변환기', icon:'🎨', color:'#EC4899'},
    'random-picker':        {name:'랜덤 뽑기', icon:'🎲', color:'#F59E0B'},
    'loan-calculator':      {name:'대출 이자 계산기', icon:'🏦', color:'#0EA5E9'},
    'age-calculator':       {name:'만 나이 계산기', icon:'🎂', color:'#A855F7'},
    'savings-calculator':   {name:'예적금 이자 계산기', icon:'💹', color:'#10B981'},
    'income-tax-calculator':{name:'소득세 계산기', icon:'📋', color:'#A16207'},
  };

  // === 다음 추천 도구 매핑 (스마트 큐레이션) ===
  const SUGGESTIONS = {
    'salary-calculator': [
      {slug:'income-tax-calculator', reason:'정확한 소득세를 따로 계산해보세요'},
      {slug:'loan-calculator', reason:'이 연봉으로 받을 수 있는 대출은?'},
      {slug:'savings-calculator', reason:'월급 일부를 예금에 넣으면 얼마?'}
    ],
    'income-tax-calculator': [
      {slug:'salary-calculator', reason:'세후 실수령액도 함께 확인하세요'},
      {slug:'savings-calculator', reason:'환급금으로 적금 들면?'},
      {slug:'percent-calculator', reason:'세율 변화율 계산해보기'}
    ],
    'loan-calculator': [
      {slug:'salary-calculator', reason:'월급으로 갚을 수 있는지 확인'},
      {slug:'percent-calculator', reason:'금리 차이 비교해보기'},
      {slug:'savings-calculator', reason:'대신 적금에 넣으면 얼마 모일까?'}
    ],
    'savings-calculator': [
      {slug:'percent-calculator', reason:'복리 vs 단리 차이 계산'},
      {slug:'loan-calculator', reason:'대출 이자와 비교해보기'},
      {slug:'salary-calculator', reason:'월급 대비 저축률 확인'}
    ],
    'bmi-calculator': [
      {slug:'unit-converter', reason:'kg ↔ lb, cm ↔ inch 변환'},
      {slug:'timer', reason:'운동 시간 측정하기'},
      {slug:'percent-calculator', reason:'체중 감량률 계산'}
    ],
    'exchange-rate': [
      {slug:'unit-converter', reason:'해외직구 사이즈도 함께 확인'},
      {slug:'percent-calculator', reason:'환율 변동률 계산'},
      {slug:'salary-calculator', reason:'외화 연봉을 원화로 환산'}
    ],
    'unit-converter': [
      {slug:'exchange-rate', reason:'해외직구 환율도 함께 확인'},
      {slug:'bmi-calculator', reason:'키·몸무게로 BMI 측정'},
      {slug:'percent-calculator', reason:'사이즈 차이 비율 계산'}
    ],
    'percent-calculator': [
      {slug:'salary-calculator', reason:'연봉 인상률 계산해보기'},
      {slug:'loan-calculator', reason:'대출 금리 적용하기'},
      {slug:'savings-calculator', reason:'저축 수익률 계산'}
    ],
    'date-calculator': [
      {slug:'age-calculator', reason:'만 나이 함께 계산하기'},
      {slug:'timer', reason:'시간 측정 도구 사용하기'},
      {slug:'salary-calculator', reason:'근속 기간으로 연봉 추정'}
    ],
    'age-calculator': [
      {slug:'date-calculator', reason:'D-Day, 일수 계산'},
      {slug:'bmi-calculator', reason:'나이별 적정 BMI 확인'},
      {slug:'salary-calculator', reason:'세대별 평균 연봉 비교'}
    ],
    'char-counter': [
      {slug:'date-calculator', reason:'마감일 D-Day 계산'},
      {slug:'percent-calculator', reason:'글자수 비율 계산'},
      {slug:'qr-generator', reason:'완성된 글을 QR코드로 공유'}
    ],
    'timer': [
      {slug:'date-calculator', reason:'장기 일정 D-Day 관리'},
      {slug:'random-picker', reason:'랜덤 뽑기로 결정'},
      {slug:'percent-calculator', reason:'시간 비율 계산'}
    ],
    'qr-generator': [
      {slug:'color-converter', reason:'QR코드 색상 코드 찾기'},
      {slug:'char-counter', reason:'담을 텍스트 글자수 확인'},
      {slug:'unit-converter', reason:'인쇄 사이즈 변환 (cm ↔ inch)'}
    ],
    'color-converter': [
      {slug:'qr-generator', reason:'색상 코드로 브랜드 QR 만들기'},
      {slug:'unit-converter', reason:'디자인 사이즈 변환'},
      {slug:'percent-calculator', reason:'색상 투명도 % 계산'}
    ],
    'random-picker': [
      {slug:'timer', reason:'타이머와 함께 게임 진행'},
      {slug:'percent-calculator', reason:'당첨 확률 계산'},
      {slug:'date-calculator', reason:'추첨일 D-Day 관리'}
    ],
  };

  // === 현재 도구 슬러그 감지 ===
  function getCurrentToolSlug() {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-z-]+)\/?$/);
    if (match && TOOLS[match[1]]) return match[1];
    return null;
  }

  // === 도구 사용 기록 ===
  function recordToolUsage() {
    const slug = getCurrentToolSlug();
    if (!slug) return;
    try {
      let recent = JSON.parse(localStorage.getItem('jway_recent_tools') || '[]');
      recent = recent.filter(s => s !== slug);
      recent.unshift(slug);
      recent = recent.slice(0, 6);
      localStorage.setItem('jway_recent_tools', JSON.stringify(recent));
    } catch (e) { /* ignore */ }
  }

  // === 추천 배너 + 공유 버튼 삽입 ===
  function injectEngagement() {
    const slug = getCurrentToolSlug();
    if (!slug) return;

    // 광고 배너 위에 삽입 (또는 main의 끝에)
    const adBanner = document.querySelector('.ad-banner');
    const main = document.querySelector('main') || document.body;

    // 스타일 주입
    if (!document.getElementById('jway-engagement-style')) {
      const style = document.createElement('style');
      style.id = 'jway-engagement-style';
      style.textContent = `
        .jway-engagement{margin:32px 0;padding:24px 20px;background:#FFFEF7;border:1.5px solid #FCD34D;border-radius:14px}
        .jway-engagement-title{font-size:15px;font-weight:700;color:#92400E;margin-bottom:6px;display:flex;align-items:center;gap:6px}
        .jway-engagement-sub{font-size:13px;color:#78350F;margin-bottom:14px}
        .jway-suggest-grid{display:grid;grid-template-columns:1fr;gap:10px}
        @media(min-width:520px){.jway-suggest-grid{grid-template-columns:1fr 1fr 1fr}}
        .jway-suggest-card{display:block;background:#fff;border:1.5px solid #FDE68A;border-radius:10px;padding:14px 16px;text-decoration:none;color:#1A1A1A;transition:all .2s}
        .jway-suggest-card:hover{border-color:#F59E0B;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.06)}
        .jway-suggest-icon{font-size:20px;margin-bottom:6px}
        .jway-suggest-name{font-size:14px;font-weight:600;margin-bottom:4px}
        .jway-suggest-reason{font-size:12px;color:#6B5A2E;line-height:1.5}
        .jway-share-bar{margin:24px 0;padding:14px 18px;background:#F0F9FF;border:1.5px solid #93C5FD;border-radius:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
        .jway-share-text{font-size:13px;color:#1E40AF;flex:1;min-width:200px;font-weight:500}
        .jway-share-btn{padding:8px 16px;background:#3B82F6;color:#fff;border:none;border-radius:6px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:background .2s}
        .jway-share-btn:hover{background:#2563EB}
        .jway-share-btn.copied{background:#10B981}
      `;
      document.head.appendChild(style);
    }

    // 1) 공유 바
    const currentTool = TOOLS[slug];
    const shareBar = document.createElement('div');
    shareBar.className = 'jway-share-bar';
    shareBar.innerHTML = `
      <span class="jway-share-text">📌 ${currentTool.icon} ${currentTool.name}가 도움 됐다면 친구에게 공유해보세요!</span>
      <button class="jway-share-btn" id="jway-share-btn">🔗 링크 복사</button>
    `;

    // 2) 추천 배너
    const suggestions = SUGGESTIONS[slug] || [];
    if (suggestions.length > 0) {
      const banner = document.createElement('div');
      banner.className = 'jway-engagement';
      const cards = suggestions.map(s => {
        const t = TOOLS[s.slug];
        if (!t) return '';
        return `<a href="https://jwaytools.com/${s.slug}/" class="jway-suggest-card">
          <div class="jway-suggest-icon">${t.icon}</div>
          <div class="jway-suggest-name">${t.name}</div>
          <div class="jway-suggest-reason">${s.reason}</div>
        </a>`;
      }).join('');
      banner.innerHTML = `
        <div class="jway-engagement-title">💡 다음으로 이런 도구는 어때요?</div>
        <div class="jway-engagement-sub">방금 사용한 도구와 함께 쓰면 더 유용한 도구를 추천해드려요</div>
        <div class="jway-suggest-grid">${cards}</div>
      `;
      // 광고 배너 앞에 삽입
      if (adBanner && adBanner.parentNode) {
        adBanner.parentNode.insertBefore(shareBar, adBanner);
        adBanner.parentNode.insertBefore(banner, adBanner);
      } else if (main) {
        main.appendChild(shareBar);
        main.appendChild(banner);
      }
    } else {
      if (adBanner && adBanner.parentNode) {
        adBanner.parentNode.insertBefore(shareBar, adBanner);
      } else if (main) {
        main.appendChild(shareBar);
      }
    }

    // 공유 버튼 동작
    const btn = document.getElementById('jway-share-btn');
    if (btn) {
      btn.addEventListener('click', async () => {
        const url = window.location.href;
        const title = document.title;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
            return;
          } catch (e) { /* fall through */ }
        }
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = '✓ 복사됨!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = '🔗 링크 복사';
            btn.classList.remove('copied');
          }, 2000);
        } catch (e) {
          alert('링크: ' + url);
        }
      });
    }
  }

  // === 홈페이지 "최근 사용한 도구" 렌더링 ===
  function renderRecentTools() {
    const container = document.getElementById('jway-recent-tools');
    if (!container) return;
    const section = document.getElementById('recent-tools-section');
    let recent = [];
    try {
      recent = JSON.parse(localStorage.getItem('jway_recent_tools') || '[]');
    } catch (e) { return; }
    if (recent.length === 0) {
      if (section) section.style.display = 'none';
      return;
    }
    const cards = recent.map(slug => {
      const t = TOOLS[slug];
      if (!t) return '';
      return `<a href="/${slug}/" class="recent-tool-card" style="--tool-color:${t.color}">
        <span class="recent-tool-icon">${t.icon}</span>
        <span class="recent-tool-name">${t.name}</span>
      </a>`;
    }).join('');
    container.innerHTML = cards;
    if (section) section.style.display = '';
  }

  // === 초기화 ===
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  function init() {
    recordToolUsage();
    injectEngagement();
    renderRecentTools();
  }
})();
