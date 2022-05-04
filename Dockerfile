FROM node

COPY . /home/server/

WORKDIR /home/server

RUN npm install 

CMD npm start
