FROM node:22

# ===== ARGS =====
ARG FRONT_PORT

# ===== ENVS =====
ENV FRONT_PORT=${FRONT_PORT}
ENV NODE_ENV=development

# ===== WORKDIR =====
WORKDIR /frontend

# ===== INSTALL DEPENDENCIES =====
COPY package*.json ./

RUN npm install

# ===== GLOBALS (OPCIONAL) =====
RUN npm install -g vite

# ===== COPY PROJECT =====
COPY . .

# ===== PORT =====
EXPOSE ${FRONT_PORT}

# ===== COMMAND =====
CMD ["npm", "run", "dev"]
