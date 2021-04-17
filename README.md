## 프로그라운드 서버 외주
### Introduction
소프트스퀘어드 외주 연계로 온라인 러닝 크루 [프로그라운드](https://proground.co.kr/) 앱 백엔드 외주를 진행했습니다.

### Directory Structure
```
📂 config
 ├── 📄 email.js
 ├── 📄 express.js
 ├── 📄 jwtMiddleware.js
 └── 📄 winston.js
📂 progress
 └── 📄 DATE.md
📂 middlewares
 └── 📂 app
 |    ├── 📂 controller
 |    |    ├── 📄 activityController.js
 |    |    ├── 📄 adminController.js
 |    |    ├── 📄 challengeController.js
 |    |    ├── 📄 chattingController.js
 |    |    ├── 📄 noticeController.js
 |    |    ├── 📄 runningController.js
 |    |    └── 📄 userController.js
 |    ├── 📂 dao
 |    |    ├── 📄 activityDao.js
 |    |    ├── 📄 adminDao.js
 |    |    ├── 📄 challengeDao.js
 |    |    ├── 📄 chattingDao.js
 |    |    ├── 📄 noticeDao.js
 |    |    ├── 📄 runningDao.js
 |    |    └── 📄 userDao.js
 |    └── 📂 routes
 |         ├── 📄 activityRoute.js
 |         ├── 📄 adminRoute.js
 |         ├── 📄 challengeRoute.js
 |         ├── 📄 chattingRoute.js
 |         ├── 📄 noticeRoute.js
 |         ├── 📄 runningRoute.js
 |         └── 📄 userRoute.js
 └── 📂 utils
      ├── 📄 awsS3.js
      └── 📄 notification.js
📄 .gitignore
📄 index.js
📄 package.json
```

### Role
- 서버 구축
- ERD 설계
- API 구현 및 명세서 작성
- 카카오 로그인 (`OAuth`)
- 푸쉬 알림 (`firebase-admin`, `node-schedule`)

### Architecture
![proground_architecture](https://user-images.githubusercontent.com/46131688/115106916-a2d02380-9fa2-11eb-895a-04f684954319.png)

### Picture
![proground](https://user-images.githubusercontent.com/46131688/115106922-abc0f500-9fa2-11eb-814e-6d25c5bc6e53.PNG)

