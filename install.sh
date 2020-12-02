ls |grep node_modules
# when not found node_modules, do npm install 
if [ $? = 1 ]; then 
 app_name=`pwd`
 docker_image_name=lqwangxg/node

 echo "not found node_modules, npm install ... "
 docker run -it --rm \
 -v $app_name:/app \
 -v ~/npm/:/root/.npm/ \
 $docker_image_name \
 npm install \
 npm install --save-dev typescript @types/node@12 \
 npm install --save-dev ts-node nodemon rimraf npm-run-all \
 npm install --save-dev dev @types/dotenv \
 npm install --save-dev express-session @types/express-session \
 npm install --save-dev fs-extra @types/fs-extra \
 npm install --save-dev shelljs @types/shelljs
else
 echo "node_modules is exist, skip npm install. \n you can npm install packagename by ./edit.sh" 
fi
