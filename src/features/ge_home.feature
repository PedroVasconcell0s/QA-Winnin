Feature: GE Home

  Scenario: Acessar home do GE
    Given que acesso o site GE
    Then o título deve conter "ge.globo"

  Scenario Outline: Validação de Menu
    Given que acesso o site GE
    Then visualizar o menu "<menu>"

    Examples:
      | menu      |
      | globo.com |
      | g1        |
      | ge        |
      | gshow     |
      | globoplay |

  Scenario: Validar o campo de Busca
    Given que acesso o site GE
    When busco por "Santos"
    Then encontro resultados refente a "Santos"

  Scenario: Validar estrutura das notícias do feed
    Given que acesso o site GE
    Then devo ver título, imagem, resumo e link em ao menos 10 notícias do feed