interface IFuncionario {
    codigo: number,
    nome: string
};

class funcionario implements IFuncionario {
    codigo: number;
    nome: string;
    constructor(codigo: number, nome: string) {
        this.codigo = codigo;
        this.nome = nome;
    }
}

const funcionario2: { codigo: number, nome: string } = {
    codigo: 10,
    nome: 'joao'
}

const funcionarioObj2: IFuncionario = {
    codigo: 10,
    nome: 'João'
}
const funcionario3 = new funcionario(10, "Joao");