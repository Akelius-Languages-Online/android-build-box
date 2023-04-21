#!/usr/bin/env sh
set -o errexit

cd /university-language-app-android
git init
git remote add origin git@github.com:Akelius-Languages-Online/university-language-app-android.git
git fetch origin
git checkout -b develop remotes/origin/develop

touch /university-language-app-android/local.properties
{
  printf "sdk.dir=/Users/%s/Library/Android/sdk\n" "$USER"
  printf "spot.http_server.token_salt=%s" "$SPOT_LOCAL_TOKEN_SALT"
  printf "spot.http_server.identity=%s\n" "$SPOT_LOCAL_IDENTITY_MAGICK"
  printf "jfrog.username=%s\n" "$JFROG_USERNAME"
  printf "jfrog.password=%s\n" "$JFROG_PASSWORD"
} >> local.properties

# Updating gradle properties - required to build in Azure Kubernetes
file_path="/university-language-app-android/gradle.properties"

#Probably we don't need to use all these replacements - there is a need to play with deployment further
original_value="org.gradle.parallel=true"
replacement_value="org.gradle.parallel=false"
sed -i "s/$original_value\b/$replacement_value/g" $file_path

original_value='-Xmx4096[mM]'
replacement_value='-Xmx2048m'
sed -i "/^org\.gradle\.jvmargs/s/$original_value/$replacement_value/g" gradle.properties

original_value="org.gradle.daemon=true"
replacement_value="org.gradle.daemon=false"
sed -i "s/$original_value\b/$replacement_value/g" $file_path

cd /app

# Start the server
node server.js
