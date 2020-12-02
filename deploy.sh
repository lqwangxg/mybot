docker logs $container_name | tail -n13 | grep error
if [ $? = 1 ]; then 
  if [ -z $app_name ]; then 
    tag_name=typenode
  else
    tag_name=`echo "$app_name" | awk -F / '{print $3 }'`
  fi
  echo "source build succeeded!. tag_name=$tag_name"
  docker build -t "lqwangxg/$tag_name" -f Dockerfile.deploy .
else 
  echo "source build error, stoped. "
fi
