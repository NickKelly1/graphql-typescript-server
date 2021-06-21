# https://blog.container-solutions.com/tagging-docker-images-the-right-way
NAME		:= nick3141/graphql_typescript_server
# tag as git commit:
# TAG 		:= $$(git log -1 --pretty=%h)
# tag as package.json version:
# https://gist.github.com/DarrenN/8c6a5b969481725a4413
TAG 		:= $$(cat package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
IMG			:= ${NAME}:${TAG}
LATEST	:= ${NAME}:latest

update-scripts:
	curl "https://cdn.jsdelivr.net/npm/react@16/umd/react.production.min.js" -sL --max-redirs 10 -o "public/scripts/react.js"
	curl "https://cdn.jsdelivr.net/npm/react-dom@16/umd/react-dom.production.min.js" -sL --max-redirs 10 -o "public/scripts/react-dom.js"
	curl "https://unpkg.com/graphiql/graphiql.min.css" -sL --max-redirs 10 -o "public/stylesheets/graphiql.min.css"
	curl "https://unpkg.com/graphiql/graphiql.min.js" -sL --max-redirs 10 -o "public/scripts/graphiql.min.js"
	curl "https://cdn.jsdelivr.net/es6-promise/4.0.5/es6-promise.auto.min.js" -sL --max-redirs 10 -o "public/scripts/es6-promise.auto.min.js"
	curl "https://cdn.jsdelivr.net/fetch/0.9.0/fetch.min.js" -sL --max-redirs 10 -o "public/scripts/fetch.min.js"
	curl "https://cdn.jsdelivr.net/npm/graphql-voyager/dist/voyager.css" -sL --max-redirs 10 -o "public/stylesheets/voyager.css"
	curl "https://cdn.jsdelivr.net/npm/graphql-voyager/dist/voyager.min.js" -sL --max-redirs 10 -o "public/scripts/voyager.min.js"
	curl "https://cdn.jsdelivr.net/npm/graphql-voyager/dist/voyager.min.js" -sL --max-redirs 10 -o "public/scripts/voyager.min.js"
	curl "https://cdn.jsdelivr.net/npm/graphql-voyager/dist/voyager.worker.js" -sL --max-redirs 10 -o "public/scripts/voyager.worker.js"

echo-tag:
	echo ${TAG}

build:
	docker build -t ${IMG} .
	docker tag ${IMG} ${LATEST}

build-no-cache:
	docker build --no-cache=true -t ${IMG} .
	docker tag ${IMG} ${LATEST}

push:
	docker push ${NAME}

pull:
	docker pull ${NAME}

login:
	docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}

up-d:
	docker-compose --env-file .env.prod -f docker-compose.prod.yml up -d

dev-up-d:
	docker-compose --env-file .env -f docker-compose.dev.yml up -d

reload-stop:
	docker stop example_gql_ts_accounts
	docker rm example_gql_ts_accounts
	docker image rm ${NAME}

reload-git:
	git pull

reload-up:
	make up-d

reload:
	make reload-stop
	make reload-git
	make reload-up

deploy:
	make build
	make push