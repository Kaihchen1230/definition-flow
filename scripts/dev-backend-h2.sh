#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"
mvn --global-settings .mvn/settings.xml -s .mvn/settings.xml -Dmaven.repo.local=.m2/repository spring-boot:run -Dspring-boot.run.profiles=h2

