# KT플라자 만남로점 통합 웹페이지 (GitHub Pages)

## 1) 업로드 방법
1. GitHub에서 새 Repository 생성
2. 아래 파일을 레포 루트에 업로드
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`
3. `assets/` 폴더 생성 후 영상/이미지 업로드 (경로 유지)

## 2) GitHub Pages 켜기
- Settings → Pages → Build and deployment
- Source: `Deploy from a branch`
- Branch: `main` / Folder: `/root`
- 저장 후 제공되는 URL로 접속하면 완료

## 3) 교체할 항목
- 점장 연락 버튼/전화번호: `index.html`에서 `tel:010-1234-5678` 변경
- 인트로 영상: `assets/intro.mp4`
- 단체사진: `assets/team.jpg`
- 이 달의 소식 영상(9:16): `assets/news.mp4`
- 상담사 프로필: `assets/profile/*.jpg`
- 상담사/예약/블로그/단골 링크: `index.html`에서 `https://www.naver.com` 부분 변경
