class Calculator {
    constructor(number){
        this.number = number;
    }
    add(number) {
        this.number+=number;
    }
    subtract(number){
        this.number-=number;
        return this.number;
    }
    multiply(number){
        this.number*=number;
        return this.number;
    }
    result(){
        return this.number
    }
}
const newa = new Calculator(32).add(2).result();
console.log(newa);