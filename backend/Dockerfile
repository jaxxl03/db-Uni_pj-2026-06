# Node.js LTS 버전 이미지를 사용
FROM node:18-alpine

# 앱 디렉토리 생성
WORKDIR /usr/src/app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 앱 소스 복사
COPY . .

# 서버 포트 노출
EXPOSE 5000

# 서버 실행
CMD [ "npm", "start" ]
