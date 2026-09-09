@echo off

set BASE=C:\Users\Administrator\Desktop\Python-practice\shopshere-microservices-\microservices\services
set START_CMD=npm run dev

start cmd /k "cd /d %BASE%\address && %START_CMD%"
start cmd /k "cd /d %BASE%\admin && %START_CMD%"
start cmd /k "cd /d %BASE%\api-gateway && %START_CMD%"
start cmd /k "cd /d %BASE%\auth && %START_CMD%"
start cmd /k "cd /d %BASE%\cart && %START_CMD%"
start cmd /k "cd /d %BASE%\order && %START_CMD%"
start cmd /k "cd /d %BASE%\payment && %START_CMD%"
start cmd /k "cd /d %BASE%\product && %START_CMD%"
start cmd /k "cd /d %BASE%\rag && %START_CMD%"
start cmd /k "cd /d %BASE%\review && %START_CMD%"
start cmd /k "cd /d %BASE%\support && %START_CMD%"
start cmd /k "cd /d %BASE%\user && %START_CMD%"
start cmd /k "cd /d %BASE%\vendor && %START_CMD%"