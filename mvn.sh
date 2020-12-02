docker run -it --rm --name myproject -v "$(pwd)":/usr/src/mymaven -w /usr/src/mymaven lqwangxg/maven-java11 mvn $@
