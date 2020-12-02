sh_cmd=$1
if [ -z "$sh_cmd" ]; then 
  sh_cmd="sh"
fi
echo "sh_cmd:$sh_cmd"

app_name=`pwd`

echo "app_name root path:$app_name"

docker_image_name="lqwangxg/node"

./install.sh

echo "docker run $docker_image_name ... "
docker run -it --rm \
-p $RANDOM:3000 \
-v $app_name:/app \
-v ~/npm/:/root/.npm/ \
$docker_image_name \
$sh_cmd
