FROM node

WORKDIR /home/server

COPY . /home/server/

RUN npm install 

CMD npm start
