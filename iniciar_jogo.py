import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(__file__), 'web')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    os.chdir(os.path.dirname(__file__))
    url = f"http://localhost:{PORT}"
    
    print("=" * 60)
    print("♟️  DAMAS 3D MASTER - INICIANDO JOGO NO NAVEGADOR...")
    print("=" * 60)
    print(f"\nServidor rodando em: {url}")
    print("Pressione Ctrl+C a qualquer momento para encerrar o servidor.\n")

    # Abre o navegador automaticamente
    webbrowser.open(url)

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("✓ Jogo aberto no navegador com sucesso!")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado. Obrigado por jogar!")
    except OSError as e:
        if "Address already in use" in str(e) or e.errno == 98 or e.errno == 10048:
            print(f"\nA porta {PORT} já está em uso. Acesse diretamente: {url}")
            webbrowser.open(url)
        else:
            raise e

if __name__ == '__main__':
    main()
