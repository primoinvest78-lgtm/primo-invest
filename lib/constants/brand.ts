/**
 * Caminho único da logo (public/). Trocar a logo é trocar o arquivo
 * em public/ e esta linha — nunca precisa caçar cada tela que usa a
 * imagem (login, recuperar/redefinir senha, sidebar, favicon, página
 * de erro).
 *
 * Nome novo combinado: public/primo-invest-logo-v2.png. Enquanto esse
 * arquivo não existir, aponta pro atual (primo-invest-logo.png) pra
 * não quebrar imagem em produção — trocar aqui assim que o arquivo
 * novo estiver em public/.
 */
export const LOGO_SRC = "/primo-invest-logo.png";
