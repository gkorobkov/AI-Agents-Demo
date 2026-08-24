@echo off
setlocal enabledelayedexpansion

scp -r ./.build/ui/* user@server.ru:/home/user/folder/

rem rsync -avz ./.build/ui/* user@server.ru:/home/user/folder/
