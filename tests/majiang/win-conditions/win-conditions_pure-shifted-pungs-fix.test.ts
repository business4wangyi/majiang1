import { expect } from 'chai';
import { Tile, TileType } from '../../../src/majiang/core/tile';
import { PureShiftedPungsDetector } from '../../../src/majiang/core/win-conditions/win-conditions_pure-shifted-pungs';

describe('PureShiftedPungsDetector Fix Test', () => {
  const detector = new PureShiftedPungsDetector();
  
  it('should correctly identify number tiles', () => {
    // 创建不同类型的牌
    const wanTile = new Tile(TileType.WAN, 1, 1);
    const tiaoTile = new Tile(TileType.TIAO, 2, 2);
    const tongTile = new Tile(TileType.TONG, 3, 3);
    const fengTile = new Tile(TileType.FENG, 1, 4);
    const jianTile = new Tile(TileType.JIAN, 1, 5);
    
    // 访问私有方法进行测试
    const isNumberTile = (detector as any).isNumberTile.bind(detector);
    
    // 验证数字牌识别
    expect(isNumberTile(wanTile)).to.be.true;
    expect(isNumberTile(tiaoTile)).to.be.true;
    expect(isNumberTile(tongTile)).to.be.true;
    
    // 验证非数字牌识别
    expect(isNumberTile(fengTile)).to.be.false;
    expect(isNumberTile(jianTile)).to.be.false;
  });
}); 