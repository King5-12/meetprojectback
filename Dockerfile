FROM node


WORKDIR /home/server

COPY . /home/server/

RUN npm install 

CMD npm run start:prod

EXPOSE 8080