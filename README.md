## Local Test

### install

```bash
## install
$ npm ci
## build client
$ npm run build
## format
$ npm run format
## dev
$ npm run build:watch
$ npm run start
```

### local ssl

If you want to test in local, you have to create cert key. here's example.

```bash
$ openssl req -x509 -newkey rsa:2048 -keyout keytmp.pem -out cert.pem -days 365

Enter PEM pass phrase:{your password}
Verifying - Enter PEM pass phrase:{your password}
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:CA
State or Province Name (full name) [Some-State]:ON
...
```

```bash
$ openssl rsa -in keytmp.pem -out key.pem
Enter pass phrase for keytmp.pem:{your password}
```

### test page
```
https://localhost:3000/strean.html?roomId=1&userId=1
https://localhost:3000/viewer.html?roomId=1
```

## start

### install

```bash
$ sudo apt update && sudo apt upgrade -y
## install git
$ sudo apt install -y build-essential curl git
## install curl
$ sudo apt install -y curl
## install nvm (node 버전 관리)
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
## start nvm
$ . ~/.nvm/nvm.sh // 안되면 그냥 ~/.nvm/nvm.sh
## install node
$ nvm install --lts
## nginx
$ sudo apt install -y nginx
```

### get project

```bash
## 깃 설치하지 않았다면 프로젝트를 그냥 scp 로 옮겨도 됨
$ scp -i ~/<KEY_PAIR>.pem -r ./ ubuntu@<PUBLIC_IP>:~/<DIR>
```

### set https (webrtc issue)

```bash
## install certbot (free ssl)
$ sudo apt install certbot
## start
$ sudo certbot certonly --standalone -d <DOMAIN_URL> -d www.<DOMAIN_URL>

## pem files are saved in
## /etc/letsencrypt/live/<DOMAIN_URL>/fullchain.pem
## /etc/letsencrypt/live/<DOMAIN_URL>/privkey.pem

## then have to
$ sudo chmod <FILE>
```

```
Error: EACCES: permission denied, open ...
뜬다면 링크 된 파일이나 경로까지 권한 수정해보거나 사용자가 root 가 아니라 ubuntu 라서 안될 가능성이 높음 chgrp 등으로 변경
```

### set TURN Server

```bash
## install TURN server
$ sudo apt install coturn
## create service file (etc/coturn/coturn.service)
$ sudo nano /etc/systemd/system/coturn.service
## coturn config
$ sudo nano /etc/turnserver.conf

## service reload
$ sudo systemctl daemon-reload
## coturn service enable
$ sudo systemctl enable coturn
## start
$ sudo systemctl start coturn
$ sudo systemctl restart coturn
## status
$ sudo systemctl status coturn
```

### run

```bash
$ cd ~/<DIR>
## install package
$ npm ci # need package-lock.json file
$ npm install # no package-lock.json
## build
$ npm run build
## start
$ node app.js
```
