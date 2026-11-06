/**
 * K ERP · 이미지 인식 중계 (Google Apps Script)
 *
 * 앱(브라우저)이 캡처 이미지를 보내면, 이 스크립트가 숨겨 둔 Gemini API 키로
 * 표를 읽어 JSON으로 돌려줍니다. 키는 스크립트 속성에만 있고 웹사이트에는 노출되지 않습니다.
 *
 * 요청을 받으면 먼저 Firebase 로그인 토큰을 확인해서
 * 최종관리자 또는 승인된 관리자만 쓸 수 있게 막습니다.
 *
 * 스크립트 속성 (프로젝트 설정 → 스크립트 속성):
 *   GEMINI_API_KEY   Google AI Studio에서 만든 키
 */

const FIREBASE_API_KEY = 'AIzaSyAERViVhY8OhU_mC5XCOc4HxWDU2rg11H8'; // 공개용 웹 키 (토큰 확인용)
const PROJECT_ID = 'k-erp-e4738';
const OWNER_EMAILS = ['paulyoung1212@gmail.com', 'neanias330@gmail.com'];
const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-flash-lite'];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const who = checkUser_(body.idToken);
    if (!who.ok) return out_({ ok: false, code: 'not_allowed', message: who.message });

    const parts = [{ text: String(body.prompt || '') }];
    (body.images || []).slice(0, 6).forEach(function (im) {
      parts.push({ inline_data: { mime_type: im.mime || 'image/png', data: im.data } });
    });

    const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!key) return out_({ ok: false, code: 'ai_disabled', message: 'GEMINI_API_KEY 스크립트 속성이 비어 있습니다.' });

    let last = '';
    for (let i = 0; i < MODELS.length; i++) {
      const res = UrlFetchApp.fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/' + MODELS[i] + ':generateContent',
        {
          method: 'post',
          contentType: 'application/json',
          headers: { 'x-goog-api-key': key },
          muteHttpExceptions: true,
          payload: JSON.stringify({
            contents: [{ role: 'user', parts: parts }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0 }
          })
        });
      const code = res.getResponseCode();
      const txt = res.getContentText();
      if (code === 200) {
        const j = JSON.parse(txt);
        const t = (((j.candidates || [])[0] || {}).content || {}).parts || [];
        return out_({ ok: true, model: MODELS[i], text: t.map(function (p) { return p.text || ''; }).join('') });
      }
      last = code + ' ' + txt.slice(0, 300);
      if (code === 404) continue;          // 이 이름의 모델이 없으면 다음 모델로
      if (code === 429) return out_({ ok: false, code: 'rate_limited', message: last });
      break;
    }
    return out_({ ok: false, code: 'ai_error', message: last });
  } catch (err) {
    return out_({ ok: false, code: 'ai_error', message: String(err) });
  }
}

/** Firebase 로그인 토큰 → 누구인지 확인하고, 관리자인지 확인 */
function checkUser_(idToken) {
  if (!idToken) return { ok: false, message: '로그인 정보가 없습니다.' };
  const r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ idToken: idToken })
  });
  if (r.getResponseCode() !== 200) return { ok: false, message: '로그인이 만료됐어요. 새로고침해 주세요.' };
  const u = (JSON.parse(r.getContentText()).users || [])[0];
  if (!u) return { ok: false, message: '사용자를 찾지 못했어요.' };
  const email = String(u.email || '').toLowerCase();
  if (u.emailVerified && OWNER_EMAILS.indexOf(email) >= 0) return { ok: true, email: email };

  // 승인된 관리자인지: 본인 토큰으로 자기 members 문서를 읽음 (보안 규칙이 허용하는 범위)
  const m = UrlFetchApp.fetch(
    'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents/members/' + u.localId,
    { headers: { Authorization: 'Bearer ' + idToken }, muteHttpExceptions: true });
  if (m.getResponseCode() === 200) {
    const f = JSON.parse(m.getContentText()).fields || {};
    if (f.role && f.role.stringValue === 'admin') return { ok: true, email: email };
  }
  return { ok: false, message: '관리자 승인이 필요합니다.' };
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** 붙여넣은 뒤 한 번 실행해서 외부 연결 권한을 승인하세요. */
function authorize() {
  UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true });
  Logger.log('권한 승인 완료. GEMINI_API_KEY 설정: ' + !!PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'));
}
