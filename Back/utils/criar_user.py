import requests
import json
from typing import Dict, Optional

API_BASE_URL = "http://localhost:3333"

class Color:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_section(title: str):
    print(f"\n{Color.HEADER}{Color.BOLD}{'='*60}{Color.ENDC}")
    print(f"{Color.HEADER}{Color.BOLD}{title:^60}{Color.ENDC}")
    print(f"{Color.HEADER}{Color.BOLD}{'='*60}{Color.ENDC}\n")

def print_success(message: str):
    print(f"{Color.OKGREEN}✓ {message}{Color.ENDC}")

def print_error(message: str):
    print(f"{Color.FAIL}✗ {message}{Color.ENDC}")

def print_info(key: str, value: str):
    print(f"{Color.OKCYAN}{key}:{Color.ENDC} {value}")

def register_user(name: str, nick: str, email: str, password: str, gang: str) -> Optional[Dict]:
    """Registra um novo usuário"""
    url = f"{API_BASE_URL}/auth/register"
    payload = {
        "name": name,
        "nick": nick,
        "email": email,
        "password": password,
        "gang": gang
    }

    try:
        response = requests.post(url, json=payload)

        if response.status_code == 200:
            user_data = response.json()
            print_success(f"Usuário {nick} registrado com sucesso!")
            print_info("  ID", str(user_data['id']))
            print_info("  Nome", user_data['name'])
            print_info("  Nick", user_data['nick'])
            print_info("  Email", user_data['email'])
            print_info("  Gang", user_data['gang'])
            return user_data
        else:
            error_msg = response.json().get('error', 'Erro desconhecido')
            print_error(f"Erro ao registrar {nick}: {error_msg}")
            return None

    except Exception as e:
        print_error(f"Exceção ao registrar {nick}: {str(e)}")
        return None

def login_user(identifier: str, password: str) -> Optional[str]:
    """Faz login e retorna o token JWT"""
    url = f"{API_BASE_URL}/auth/login"
    payload = {
        "identifier": identifier,
        "password": password
    }

    try:
        response = requests.post(url, json=payload)

        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            user = data.get('user')

            print_success(f"Login realizado com sucesso para {identifier}!")
            print_info("  User ID", str(user['id']))
            print_info("  Nick", user['nick'])
            print_info("  Gang", user['gang'])
            print_info("  Token", f"{token[:50]}..." if len(token) > 50 else token)

            return token
        else:
            error_msg = response.json().get('error', 'Erro desconhecido')
            print_error(f"Erro ao fazer login com {identifier}: {error_msg}")
            return None

    except Exception as e:
        print_error(f"Exceção ao fazer login com {identifier}: {str(e)}")
        return None

def get_user_info(token: str) -> Optional[Dict]:
    """Obtém informações do usuário usando o token"""
    url = f"{API_BASE_URL}/auth/me"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json()
            user = data.get('user')
            print_success("Informações do usuário obtidas com sucesso!")
            print_info("  ID", str(user['id']))
            print_info("  Nome", user['name'])
            print_info("  Nick", user['nick'])
            print_info("  Email", user.get('email', 'N/A'))
            print_info("  Gang", user['gang'])
            print_info("  Anônimo", str(user['isAnonymous']))
            return user
        else:
            error_msg = response.json().get('error', 'Erro desconhecido')
            print_error(f"Erro ao obter informações: {error_msg}")
            return None

    except Exception as e:
        print_error(f"Exceção ao obter informações: {str(e)}")
        return None

def main():
    print(f"{Color.BOLD}{Color.OKBLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║          TESTE DE AUTENTICAÇÃO - FT_TRANSCENDENCE          ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Color.ENDC}")

    # Dados dos usuários
    users_data = [
        {
            "name": "João Silva",
            "nick": "joao",
            "email": "joao@example.com",
            "password": "Senha@123",
            "gang": "potatoes"
        },
        {
            "name": "Maria Santos",
            "nick": "maria",
            "email": "maria@example.com",
            "password": "Senha@123",
            "gang": "tomatoes"
        }
    ]

    tokens = []

    for i, user_data in enumerate(users_data, 1):
        print_section(f"USUÁRIO {i}: {user_data['name']}")

        print(f"{Color.WARNING}Registrando usuário...{Color.ENDC}")
        user = register_user(
            name=user_data['name'],
            nick=user_data['nick'],
            email=user_data['email'],
            password=user_data['password'],
            gang=user_data['gang']
        )

        if user:
            print()
            print(f"{Color.WARNING}Fazendo login...{Color.ENDC}")
            token = login_user(
                identifier=user_data['email'],
                password=user_data['password']
            )

            if token:
                tokens.append({
                    'nick': user_data['nick'],
                    'token': token
                })

                print()
                print(f"{Color.WARNING}Verificando token...{Color.ENDC}")
                get_user_info(token)

    if tokens:
        print_section("RESUMO DOS TOKENS")
        for i, token_data in enumerate(tokens, 1):
            print(f"{Color.BOLD}Usuário {i}: {token_data['nick']}{Color.ENDC}")
            print(f"{Color.OKCYAN}Token completo:{Color.ENDC}")
            print(f"{token_data['token']}")
            print()

    print(f"{Color.OKGREEN}{Color.BOLD}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║                    TESTE FINALIZADO!                       ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Color.ENDC}")

if __name__ == "__main__":
    main()
