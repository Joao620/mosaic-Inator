export interface Imagem {
    dados: Uint8Array
    largura: number
    altura: number
}

export interface ImagemComNome extends Imagem {
    nome: string
}

export type cor = [number, number, number]

export interface ColecaoPixagem {
  readonly atlas: Image
  readonly larguraIndividual: number
  readonly alturaIndividial: number
  readonly quantidadePixagens: number
  readonly cores: cor[]
}

export interface ImagemParaMosaico {
  readonly imagem: ImageData
  readonly quantDivisoesLargura: number
  readonly quantDivisoesAltura: number
  readonly tamDivisoesLargura: number
  readonly tamDivisoesAltura: number
}

export interface OpcoesPixImage {
  readonly aspectRatio: number
  readonly reducaoImagemFinal: number
  readonly cpuMode: boolean
}

export interface OpcoesCriarMosaico {
  readonly aspectRatio: number
  readonly reducaoImagemFinal: number
}
