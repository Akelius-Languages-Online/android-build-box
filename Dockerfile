FROM alvrme/alpine-android

USER root

RUN apk add openssh-client
RUN apk add sshpass
RUN apk add rsync
RUN apk add python3
RUN apk add nodejs npm

ADD angular /home/angular/
WORKDIR "/home/angular"
RUN npm install --location=global npm@9.1.2
RUN npm install -g forever
RUN npm install
RUN npm run build:prod

ADD express /app/
WORKDIR "/app"
RUN npm install

WORKDIR "/"
#ADD ssh/* /root/.ssh/
ADD scripts/* /home/android/
ADD logs/* /android/


ADD project university-language-app-android/

WORKDIR "/app"
RUN cp -r /home/angular/dist /app/dist

EXPOSE 80

#todo: add git repo cloning on container startup
#RUN git clone git@github.com:Akelius-Languages-Online/university-language-app-android.git
CMD [ "forever", "server.js" ]

#todo: for test purposes
CMD ["/bin/sh", "-c", "if [ ! -f /root/.ssh/id_rsa ]; then echo 'SSH key is not available'; else echo 'SSH key is available'; fi"]


# Keep the container running after startup
# ENTRYPOINT ["tail", "-f", "/dev/null"]
