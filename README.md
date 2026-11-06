# K ERP · 자금 일정표 (Firebase 버전)

Claude 아티팩트로 만든 자금 일정표를 Firebase로 옮긴 웹앱입니다.

- 데이터: Cloud Firestore (프로젝트 `k-erp-e4738`, 서울 리전)
- 로그인: Google 계정 (Firebase Authentication)
- 권한: 최종관리자가 승인한 관리자만 자금 데이터 열람·수정 (`firestore.rules`)
- 이미지 인식: Gemini (Firebase AI Logic, Gemini Developer API)
- 배포: GitHub Pages (이 저장소의 파일 그대로)

## 파일

| 파일 | 내용 |
| --- | --- |
| `index.html` | 앱 화면 전체 |
| `firestore.rules` | Firestore 보안 규칙 — Firebase 콘솔 › Firestore › 규칙에 붙여넣고 게시 |
| `manifest.webmanifest`, `icon*.png`, `icon.svg`, `sw.js` | 휴대폰 "홈 화면에 추가"용 |

이 저장소에는 **코드만** 있습니다. 자금 데이터는 Firestore에만 저장되며 저장소에 올리지 않습니다.
`firebaseConfig` 값은 공개되어도 되는 접속 정보이고, 실제 보호는 보안 규칙이 합니다.

## 할 일 (잊지 말 것)

- [ ] **앱 체크(App Check) 넣기 — 기한 2027-01-20.** Firebase AI Logic에 앱 체크가 **2027-01-21 자동 적용**된다.
      그 전에 `index.html`에 App Check(reCAPTCHA Enterprise 또는 v3)를 넣고, 콘솔 › 보안 › App Check에서 `erp-web` 앱을 등록해야
      이미지 인식(일괄 추가 캡처, 문서 인식 테스트)이 끊기지 않는다. 현재 AI Logic 앱 체크는 "적용되지 않음(모니터링만)".
- [ ] 구글 시트 자동 복사(앱스 스크립트, 5~10분 주기) — 보류 중. 붙이기 전까지 텔레그램 브리핑은 예전 시트 기준.
