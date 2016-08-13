
#!/bin/sh

BITWIG_SCRIPTS_DIR="$HOME/Documents/Bitwig Studio/Controller Scripts"
FACTOTUMO_SCRIPTS_DIR="$BITWIG_SCRIPTS_DIR/Factotumo"

if [ ! -d "$BITWIG_SCRIPTS_DIR" ]; then
	echo "bitwig scripts dir '$BITWIG_SCRIPTS_DIR' doesn't exist"
	echo "exiting install"
	exit 1
fi


if [ -d "$FACTOTUMO_SCRIPTS_DIR" ]; then
	echo "factotumo scripts dir already exists"
	echo "copying '`pwd`/Factotumo/*' subdirs to '$FACTOTUMO_SCRIPTS_DIR'"
	cp -vr ./Factotumo/* "$FACTOTUMO_SCRIPTS_DIR"
else
	echo "factotumo scripts dir doesn't already exist"
	echo "copying '`pwd`/Factotumo' to $BITWIG_SCRIPTS_DIR"
	cp -vr ./Factotumo "$BITWIG_SCRIPTS_DIR"
fi

exit 0