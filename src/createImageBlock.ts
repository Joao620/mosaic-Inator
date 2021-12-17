import { GPU, Input } from "gpu.js";
import { createCanvas, loadImage } from 'node-canvas'

import { cor, Imagem } from "./types";
import { calcularMediaCores } from './kernels'

export default async function gerarPixagem(imagensCodificadas: Imagem[], proporcaoEscolida: number, reducaoTamanho: number): Promise<[Imagem, cor[]]>{
    //TODO: Isso parece que vai gastar memoria pra porra
    const blocaoCanvas = await criarBlocaoImagem(imagensCodificadas, proporcaoEscolida, reducaoTamanho)
    
    //nao sei se esse -1 funcionar, mas eu confio que vai
    const blocaoData = blocaoCanvas.getContext('2d').getImageData(0, 0, blocaoCanvas.width, blocaoCanvas.height)

    const coresBlocao = pegarCoresBlocao(blocaoData, imagensCodificadas.length)

    const blocaoCodificado: Imagem = {
        largura: blocaoCanvas.width,
        altura: blocaoCanvas.height,
        dados: blocaoCanvas.toBuffer('image/png')
    }
    
    return [blocaoCodificado, coresBlocao]
}

function pegarCoresBlocao(blocao: ImageData, quantidadeImagens: number){
    const laguraImagem = blocao.width
    const alturaImagens = blocao.height / quantidadeImagens

    const gpu = new GPU()

    const configs = {
        output: [quantidadeImagens, 1],
        constants: {largura: blocao.width, altura: blocao.height, divisoesLargura: 1, divisoesAltura: quantidadeImagens}
    }

    const kernelCores = gpu.createKernel(calcularMediaCores, configs)

    // a porra da biblioteca nao aceita uInt8clampedarray, mas funciona normal
    //@ts-expect-error
    const imagemDimensional = new Input(blocao.data, [4, laguraImagem, alturaImagens * quantidadeImagens])

    const resultadoKernelCores = kernelCores(imagemDimensional) as Float32Array[][]

    const resultadoCores: cor[] = resultadoKernelCores[0].map(arr => (
        {r: Math.round(arr[0]), g: Math.round(arr[1]), b: Math.round(arr[2])}
    ))

    return resultadoCores
}

export async function criarBlocaoImagem(imagens: Imagem[], proporcaoEscolida: number, reducaoTamanho: number){
    let somaTamanhoLargura = 0
    let somaTamanhoAltura = 0

    imagens.forEach(imagem => {
        const {largura, altura} = corteParaProporcao(imagem.largura, imagem.altura, proporcaoEscolida)
        somaTamanhoLargura += largura
        somaTamanhoAltura += altura
    })

    const mediaLargura = Math.floor(somaTamanhoLargura / imagens.length)
    const mediaAltura = Math.floor(somaTamanhoAltura / imagens.length)

    const proporcaoReducao = 1 / reducaoTamanho

    const larguraBlocao = mediaLargura * proporcaoReducao
    const alturaBlocao = mediaAltura * imagens.length * proporcaoReducao


    const blocaoImagem = createCanvas(larguraBlocao, alturaBlocao)
    const ctxBlocaoImagem = blocaoImagem.getContext('2d')

    for(const [index, imagem] of imagens.entries()){
        //@ts-expect-error
        const imagemInteira = await loadImage(imagem.dados)

        const {largura, altura} = corteParaProporcao(imagem.largura, imagem.altura, proporcaoEscolida)

        const larguraCortada = Math.abs(imagem.largura - largura)
        const origemLargura = Math.floor(larguraCortada / 2)

        const alturaCortada = Math.abs(imagem.altura - altura)
        const origemAltura = Math.floor(alturaCortada / 2)

        //esse demonio vai colar a imagem no blocaoImagem com a posicao e tamanho certo, nunca mexa nisso
        ctxBlocaoImagem.drawImage(
            imagemInteira,
            origemLargura,
            origemAltura,
            largura,
            altura,
            0,
            index * mediaAltura * proporcaoReducao,
            mediaLargura * proporcaoReducao,
            mediaAltura * proporcaoReducao
        )

    }

    //return ctxBlocaoImagem.getImageData(0, 0, blocaoImagem.width, blocaoImagem.height)
    return blocaoImagem

    function corteParaProporcao (imagemLargura: number, imagemAltura: number, proporcao: number){
        const proporcaoImagem = imagemLargura / imagemAltura
        let novaLargura = 0,
            novaAltura = 0

        if(proporcaoImagem >= proporcao){
            //pela a porporcao eu vejo que imagem vai creser mais a largura do que a altura
            //entao eu continuo com a altura e diminuo a largura
            novaLargura = imagemAltura * proporcao
            novaAltura = imagemAltura
        } else {
            novaAltura = imagemLargura / proporcao
            novaLargura = imagemLargura
        }

        return {largura: novaLargura, altura: novaAltura}
    }
}
