import { expect } from 'chai';
import * as sinon from 'sinon';
import { 
  Style, 
  TileTypeNames, 
  TileTypeOrder, 
  clearScreen, 
  clearLine, 
  analyzeHand, 
  groupTilesByTypeAndValue, 
  groupTilesByType, 
  createProgressBar,
  formatTileSet
} from '../src/display';
import { Player, PlayerState, PlayerType } from '../src/player';
import { Tile, TileType } from '../src/tile';
import { TileSet } from '../src/rule-types';

describe('Display模块', () => {
  // 存根控制台输出
  let stdoutStub: sinon.SinonStub;
  
  beforeEach(() => {
    // 创建process.stdout.write的存根以避免测试中实际输出内容
    stdoutStub = sinon.stub(process.stdout, 'write');
  });
  
  afterEach(() => {
    // 恢复原始函数
    stdoutStub.restore();
  });
  
  describe('常量', () => {
    it('应定义Style常量对象', () => {
      expect(Style).to.be.an('object');
      expect(Style.RESET).to.be.a('string');
      expect(Style.RED).to.be.a('string');
      expect(Style.GREEN).to.be.a('string');
      expect(Style.BOLD).to.be.a('string');
    });
    
    it('应定义TileTypeNames常量对象', () => {
      expect(TileTypeNames).to.be.an('object');
      expect(TileTypeNames[TileType.WAN]).to.equal('万子');
      expect(TileTypeNames[TileType.TIAO]).to.equal('条子');
      expect(TileTypeNames[TileType.TONG]).to.equal('筒子');
    });
    
    it('应定义TileTypeOrder常量数组', () => {
      expect(TileTypeOrder).to.be.an('array');
      expect(TileTypeOrder).to.include(TileType.WAN);
      expect(TileTypeOrder).to.include(TileType.TIAO);
      expect(TileTypeOrder).to.include(TileType.TONG);
    });
  });
  
  describe('清屏和清行函数', () => {
    it('clearScreen应该调用process.stdout.write', () => {
      clearScreen();
      expect(stdoutStub.calledOnce).to.be.true;
      expect(stdoutStub.firstCall.args[0]).to.equal('\x1Bc');
    });
    
    it('clearLine应该调用process.stdout.write', () => {
      clearLine();
      expect(stdoutStub.calledOnce).to.be.true;
      expect(stdoutStub.firstCall.args[0]).to.equal('\r\x1b[K');
    });
  });
  
  describe('牌分析函数', () => {
    it('analyzeHand应该分析玩家手牌', () => {
      // 创建测试玩家和手牌
      const player = new Player(1, '测试玩家', PlayerType.HUMAN);
      
      // 添加几张测试牌
      player.handTiles.push(new Tile(TileType.WAN, 1, 1));
      player.handTiles.push(new Tile(TileType.WAN, 1, 2));
      player.handTiles.push(new Tile(TileType.WAN, 2, 3));
      player.handTiles.push(new Tile(TileType.WAN, 2, 4));
      player.handTiles.push(new Tile(TileType.WAN, 2, 5));
      
      const analysis = analyzeHand(player);
      expect(analysis).to.be.an('array');
      expect(analysis.length).to.be.greaterThan(0);
      
      // 应该能识别出对子和刻子
      expect(analysis.some(item => item.includes('对子'))).to.be.true;
      expect(analysis.some(item => item.includes('刻子'))).to.be.true;
    });
    
    it('groupTilesByTypeAndValue应该按类型和数值分组牌', () => {
      const tiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 1, 2),
        new Tile(TileType.WAN, 2, 3),
        new Tile(TileType.TIAO, 1, 4)
      ];
      
      const groups = groupTilesByTypeAndValue(tiles);
      expect(groups).to.be.instanceOf(Map);
      expect(groups.size).to.equal(3); // 三个不同的类型-数值组合
      
      // 检查万1的组合
      const wan1Key = `${TileType.WAN}-1`;
      expect(groups.has(wan1Key)).to.be.true;
      expect(groups.get(wan1Key)!.length).to.equal(2);
    });
    
    it('groupTilesByType应该按类型分组牌', () => {
      const tiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 2),
        new Tile(TileType.TIAO, 1, 3),
        new Tile(TileType.TONG, 9, 4)
      ];
      
      const groups = groupTilesByType(tiles);
      expect(groups).to.be.instanceOf(Map);
      expect(groups.size).to.equal(3); // 三种不同的类型
      
      // 检查万牌组
      expect(groups.has(TileType.WAN)).to.be.true;
      expect(groups.get(TileType.WAN)!.length).to.equal(2);
      
      // 检查条子组
      expect(groups.has(TileType.TIAO)).to.be.true;
      expect(groups.get(TileType.TIAO)!.length).to.equal(1);
      
      // 检查筒子组
      expect(groups.has(TileType.TONG)).to.be.true;
      expect(groups.get(TileType.TONG)!.length).to.equal(1);
    });
  });
  
  describe('辅助函数', () => {
    it('createProgressBar应该创建进度条字符串', () => {
      const emptyBar = createProgressBar(0, 100);
      expect(emptyBar).to.equal('░░░░░░░░░░░░░░░░░░░░');
      
      const halfBar = createProgressBar(50, 100);
      expect(halfBar).to.equal('██████████░░░░░░░░░░');
      
      const fullBar = createProgressBar(100, 100);
      expect(fullBar).to.equal('████████████████████');
      
      // 测试自定义字符和长度
      // 5/10 = 0.5，长度为5，预期有3个X和2个O
      const customBar = createProgressBar(5, 10, 5, 'X', 'O');
      expect(customBar).to.equal('XXXOO');
    });
    
    it('formatTileSet应该格式化牌组', () => {
      const tiles = [
        new Tile(TileType.WAN, 1, 1),
        new Tile(TileType.WAN, 2, 2),
        new Tile(TileType.WAN, 3, 3)
      ];
      
      const tileSet: TileSet = { 
        tiles: tiles, 
        type: 'CHI' 
      };
      
      const formatted = formatTileSet(tileSet);
      expect(formatted).to.be.a('string');
      expect(formatted).to.include('1万');
      expect(formatted).to.include('2万');
      expect(formatted).to.include('3万');
    });
  });
}); 