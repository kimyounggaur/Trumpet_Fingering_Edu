# Vercel 자동 배포 설정

이 저장소는 `.github/workflows/vercel-auto-deploy.yml`로 GitHub push마다 Vercel 배포를 실행한다.

## 동작 방식

- `main` 브랜치 push: Vercel production 배포
- 그 외 브랜치 push: Vercel preview 배포
- 수동 실행: GitHub Actions의 `Vercel Auto Deploy` 워크플로우에서 `workflow_dispatch`

## 필요한 GitHub Actions Secrets

GitHub 저장소의 `Settings > Secrets and variables > Actions > Repository secrets`에 아래 3개를 등록한다.

- `VERCEL_TOKEN`: Vercel Account Settings에서 발급한 토큰
- `VERCEL_ORG_ID`: Vercel 팀 또는 개인 계정 ID
- `VERCEL_PROJECT_ID`: Vercel 프로젝트 ID

이 값들은 워크플로우가 `vercel pull`, `vercel build`, `vercel deploy --prebuilt`를 비대화형으로 실행하는 데 필요하다.

## 빌드 출력

Vercel은 루트 `vercel.json`을 기준으로 다음 명령을 실행한다.

```bash
npm --prefix app ci
npm --prefix app run build
```

`app/scripts/build-single-file.mjs`는 로컬 실행용 `app/index.html`과 Vercel 배포용 `dist/index.html`을 동시에 생성한다.
