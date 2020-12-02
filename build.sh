# define variables
builder_name="lqwangxg/node" 
app_name=`pwd`  

echo "app_name root path:$app_name"

./install.sh  

docker run -it --rm \
    -w /app \
    -v $app_name:/app \
    -v ~/npm/:/root/.npm/ \
    $builder_name \
    npm run build
echo "npm run build completed."

./deploy.sh
