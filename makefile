# https://blog.container-solutions.com/tagging-docker-images-the-right-way
NAME		:= nick3141/nickkelly.dev.examples.accounts
# tag as git commit:
# TAG 		:= $$(git log -1 --pretty=%h)
# tag as package.json version:
# https://gist.github.com/DarrenN/8c6a5b969481725a4413
TAG 		:= $$(cat package.json | grep version | head -1 | awk -F: '{ print $$2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
IMG			:= ${NAME}:${TAG}
LATEST	:= ${NAME}:latest

update-scripts:
	curl "https://unpkg.com/react@16/umd/react.development.js" -sL --max-redirs 10 -o "public/scripts/react.development.js"
	curl "https://unpkg.com/react-dom@16/umd/react-dom.development.js" -sL --max-redirs 10 -o "public/scripts/react-dom.development.js"
	curl "https://unpkg.com/graphiql/graphiql.min.css" -sL --max-redirs 10 -o "public/stylesheets/graphiql.min.css"
	curl "https://unpkg.com/graphiql/graphiql.min.js" -sL --max-redirs 10 -o "public/scripts/graphiql.min.js"

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

# production-up:
# 	@docker-compose --env-file .env.prod up -d
