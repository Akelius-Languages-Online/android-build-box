FROM alvrme/alpine-android

#ARG SPOT-LOCAL-TOKEN-SALT="local-token-salt"
#ARG SPOT-LOCAL-IDENTITY-MAGICK="local-identity-magick"
#ARG JFROG_USERNAME=""
#ARG JFROG_PASSWORD=""
#ARG SLACK_TOKEN=""
#ARG HOST_NAME="some-host.com"

ENV GROUP=docker
ENV USER=docker
ENV UID=1001

ENV USER_SSH_DIR=/home/${USER}/.ssh
ENV GLOBAL_SSH_DIR=/etc/ssh/

#Required for node js server
ENV PORT=8080

# 1. Install required apps
RUN apk add shadow
RUN apk add openssh-client
RUN apk add sshpass
RUN apk add rsync
RUN apk add python3
RUN apk add nodejs npm

# 2. Create non-root user - the same as in deployemnt.yml
RUN groupadd -r "$GROUP" && useradd -r -g "$GROUP" --uid "$UID" "$USER"

COPY angular /home/angular/
WORKDIR "/home/angular"
RUN npm install --location=global npm@9.1.2
RUN npm install -g forever
RUN npm install
RUN npm run build:prod

COPY express /app/
RUN chown -R "$USER":"$GROUP" /app
WORKDIR "/app"

RUN npm install

# 3. Copy ssh configs
WORKDIR "/"
#Copying in global ssh folders because we're mounting ssh keys via k8s in the user folder
COPY ssh/config  ${GLOBAL_SSH_DIR}/ssh_config
# Can be ommitted - because of the current ssh_current - but let's keep
COPY ssh/known_hosts  ${GLOBAL_SSH_DIR}/ssh_known_hosts

RUN mkdir -p ${USER_SSH_DIR}
# For local testing
#COPY ssh/android-box-builder ${USER_SSH_DIR}/id_rsa
#COPY ssh/android-box-builder.pub ${USER_SSH_DIR}/id_rsa.pub
#RUN chmod 600 ${USER_SSH_DIR}/id_rsa
RUN chown -R "$USER":"$GROUP" ${USER_SSH_DIR}/

# 4. Copy other stuff
COPY scripts/* /home/android/
COPY logs/* /android/
RUN mkdir /university-language-app-android

# 5. Add rights for the created non-root user
RUN chown -R "$USER":"$GROUP" /home/android/
RUN chown -R "$USER":"$GROUP" /android
RUN chown -R "$USER":"$GROUP" /university-language-app-android
RUN chown -R "$USER":"$GROUP" /home/docker/
RUN chown -R "$USER":"$GROUP" /opt/sdk/

WORKDIR "/app"
RUN cp -r /home/angular/dist /app/dist

EXPOSE ${PORT}

# 6. Setup entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER docker
ENTRYPOINT ["/app/entrypoint.sh"]
