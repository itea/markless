#!/bin/sh

cd src

case $1 in
debug)
    cat basic.js dom-context.js parser.js mixing.js misc.js > ../js/markless.js
    ;;
*)
    cat intro.js basic.js dom-context.js parser.js mixing.js misc.js outro.js > ../js/markless.js
    ;;
esac

