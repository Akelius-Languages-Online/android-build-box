FROM alvrme/alpine-android

USER root

RUN apk add openssh-client
RUN apk add sshpass
RUN apk add rsync
RUN apk add python3
RUN apk add nodejs npm

ADD ssh/* /root/.ssh/
ADD scripts/* /home/android/
ADD logs/* /android/

RUN git clone git@github.com:Akelius-Languages-Online/university-language-app-android.git
ADD project university-language-app-android/

ADD angular /home/angular/
WORKDIR "/home/angular"
RUN npm install --location=global npm@9.1.2
RUN npm install -g forever
RUN npm install
RUN npm run build:prod

ADD express /app/
WORKDIR "/app"
RUN npm install

RUN cp -r /home/angular/dist /app/dist

EXPOSE 80

CMD [ "forever", "server.js" ]

# Keet it running
# ENTRYPOINT ["tail", "-f", "/dev/null"]
