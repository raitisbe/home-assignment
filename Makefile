build-and-run:
	cd client && npm run build && mkdir -p ../server/public-client && cp -R build/* ../server/public-client && cd ../server && npm run start