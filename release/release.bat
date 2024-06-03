@echo off
setlocal

REM 拷贝文件到release目录
copy main.js .\release
copy manifest.json .\release
copy styles.css .\release

echo Files copied successfully to release directory.
