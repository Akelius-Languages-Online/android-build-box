# Android BuildBox

Provides cli and web interface to build android projects.

Currently used to support [Akelius Languages Online Android Application](https://github.com/Akelius-Languages-Online/university-language-app-android).

## Initial Setup

Before proceed please make sure to populate the proper `.env` and ssh keys.

### `.env`

```
HOST_NAME=<place the host or the ip of the server that will host the image>
# It's used for the slack messages to report the url for the apk download

# All SSH_ variables are for automatically uploading the apk to another machine.
# It's useful in case you implement different pipelines
SSH_HOST=<host_or_ip>
SSH_PORT=<ssh_port>
SSH_USER=<ssh_user>
SSH_PASSWORD=<ssh_password>
SSH_PATH=<ssh_path>

# Used to report to slack.
SLACK_TOKEN=<Slack webhook token>
```

### SSH keys

To properly `git clone` your repo you might need ssh keys. If so - please place them inside `ssh/` folder.

## Technologies

- angular
- express
- bash

## How to compile and run the Docker images

`Dockerfile` is located in the root folder. You can compile and run yourself or use `./compile` and `./run`.

By default `./run` redirects web from 80 to 8282.

## Angular Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
