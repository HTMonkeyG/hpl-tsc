/// <reference path="./libhpl.d.ts" />

// ============================================================================
// libminecraftne.d.ts —— 网易我的世界（NEMC）Mod SDK 类型声明
// 供 hpl-tsc 转译器与用户代码共享。所有类型均为全局环境声明。
// ============================================================================

// ----------------------------------------------------------------------------
// 基础 ID 与坐标类型
// ----------------------------------------------------------------------------

/** 实体 ID（引擎内字符串形式）。 */
type EntityId = string;
/** 玩家 ID。 */
type PlayerId = string;
/** 维度 ID：0 主世界 / 1 下界 / 2 末地。 */
type DimensionId = hpl.int;
/** 方块坐标（整数三元组）。 */
type BlockPos = hpl.tuple<readonly [hpl.int, hpl.int, hpl.int]>;
/** 二维浮点向量。 */
type Vec2 = hpl.tuple<readonly [hpl.float, hpl.float]>;
/** 三维浮点向量（位置坐标）。 */
type Vec3 = hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>;
/** 旋转角度（俯仰、偏航）。 */
type Rotation = hpl.tuple<readonly [hpl.float, hpl.float]>;
/** 区块坐标。 */
type ChunkPos = hpl.tuple<readonly [hpl.int, hpl.int]>;

// ----------------------------------------------------------------------------
// 引擎对象字典（动态 API 返回的 HplObject 载荷）
// ----------------------------------------------------------------------------

interface EntityObject extends hpl.HplObject {
  readonly entityId?: EntityId;
  readonly engineType?: hpl.int;
  readonly dimensionId?: DimensionId;
  readonly name?: string;
}
interface PlayerObject extends EntityObject {
  readonly playerId?: PlayerId;
}
interface ItemDict extends hpl.HplObject {
  readonly itemName?: string;
  readonly count?: hpl.int;
  readonly auxValue?: hpl.int;
  readonly userData?: hpl.HplObject;
}
interface PermissionDict extends hpl.HplObject {
  build: boolean;
  mine: boolean;
  doorsandswitches: boolean;
  opencontainers: boolean;
  attackplayers: boolean;
  attackmobs: boolean;
  op: boolean;
  teleport: boolean;
}
interface BlockObject extends hpl.HplObject {
  readonly blockName?: string;
  readonly auxValue?: hpl.int;
}
interface EffectObject extends hpl.HplObject {
  readonly effectName?: string;
  readonly duration?: hpl.int;
  readonly amplifier?: hpl.int;
  readonly showParticles?: boolean;
}
interface BiomeInfo extends hpl.HplObject {
  readonly biomeName?: string;
}
interface EngineActor extends hpl.HplObject {
  readonly actorEngineType?: hpl.int;
  readonly actorIdentifier?: string;
}

// ----------------------------------------------------------------------------
// 枚举值（int 型）
// ----------------------------------------------------------------------------

/** 游戏模式。Undefined=-1 Survival=0 Creative=1 Adventure=2 Spectator=6 */
type GameType = -1 | 0 | 1 | 2 | 6;
/** 游戏难度。Peaceful=0 Easy=1 Normal=2 Hard=3 Count=4 Unknown=5 */
type GameDiffculty = 0 | 1 | 2 | 3 | 4 | 5;
/** 朝向。Down=0 Up=1 North=2 South=3 West=4 East=5 */
type Facing = 0 | 1 | 2 | 3 | 4 | 5;
/** 物品位置。INVENTORY=0 OFFHAND=1 CARRIED=2 ARMOR=3 */
type ItemPosType = 0 | 1 | 2 | 3;
/**
 * 实体属性（SDK AttrType）。HEALTH=0 SPEED=1 DAMAGE=2 UNDERWATER_SPEED=3 HUNGER=4
 * SATURATION=5 ABSORPTION=6 LAVA_SPEED=7 LUCK=8 FOLLOW_RANGE=9
 * KNOCKBACK_RESISTANCE=10 JUMP_STRENGTH=11 ARMOR=12 ATTACK_KNOCKBACK=13
 * ATTACK_SPEED=14 EXPLOSION_KNOCKBACK_RESISTANCE=15 FLYING_SPEED=16
 * SNEAKING_SPEED=17 MOVEMENT_EFFICIENCY=18 WATER_MOVEMENT_EFFICIENCY=19
 * BLOCK_BREAK_SPEED=20 MINING_EFFICIENCY=21 SUBMERGED_MINING_SPEED=22
 */
type AttributeType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22;
/** 属性效果（SDK AttributeBuffType）。Hunger=0 Saturation=1 Regeneration=2 Heal=3 Harm=4 Magic=5 Wither=6 Poison=7 FatalPoison=8 SelfHeal=9 SelfDestruct=10 Unknown=11 None=12 */
type AttributeBuffType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
/** 属性修饰符运算。OperationAddition=0 OperationMultiplyBase=1 OperationMultiplyTotal=2 OperationCap=3 TotalOperations=4 OperationInvalid=5 */
type AttributeModifierOperation = 0 | 1 | 2 | 3 | 4 | 5;
/** 属性操作对象。OperandMin=0 OperandMax=1 OperandCurrent=2 TotalOperands=3 OperandInvalid=4 */
type AttributeOperands = 0 | 1 | 2 | 3 | 4;
/** 盔甲槽位。DEFAULT=-1 HEAD=0 BODY=1 LEG=2 FOOT=3 */
type ArmorSlotType = -1 | 0 | 1 | 2 | 3;
/** 方块透气性。Solid=0 Air=1 */
type BlockBreathability = 0 | 1;
/** 按钮事件类型。Clicked=0 Pressed=1 Released=2 */
type ButtonEventType = 0 | 1 | 2;
/** 按钮状态。Up=0 Down=1 */
type ButtonState = 0 | 1;
/** 容器类型。NONE=-9 INVENTORY=-1 CONTAINER=0 WORKBENCH=1 FURNACE=2 ENCHANTMENT=3 BREWING_STAND=4 ANVIL=5 DISPENSER=6 DROPPER=7 HOPPER=8 CAULDRON=9 TRADE=15 JUKEBOX=17 ARMOR=18 HAND=19 LOOM=24 GRINDSTONE=26 BLAST_FURNACE=27 SMOKER=28 STONECUTTER=29 CARTOGRAPHY=30 SMITHING_TABLE=33 CHEST_BOAT=34 DECORATED_POT=35 CRAFTER=36 */
type ContainerType = -9 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 15 | 17 | 18 | 19 | 24 | 26 | 27 | 28 | 29 | 30 | 33 | 34 | 35 | 36;
/** 输入模式。Undefined=-1 Mouse=0 Touch=1 GamePad=2 */
type InputMode = -1 | 0 | 1 | 2;
/** 物品获取方式。Unknown=-1 MethodNone=0 PickedUp=1 Crafted=2 TakenFromChest=3 TakenFromEnderchest=4 Bought=5 Anvil=6 Smelted=7 Brewed=8 Filled=9 Trading=10 Fishing=11 Container=13 Feeding=14 */
type ItemAcquisitionMethod = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 13 | 14;
/** 物品分类。Construction=1 Nature=2 Equipment=3 Items=4 Custom=7 */
type ItemCategory = 1 | 2 | 3 | 4 | 7;
/** 物品颜色。Black=0 Red=1 Green=2 Brown=3 Blue=4 Purple=5 Cyan=6 Silver=7 Gray=8 Pink=9 Lime=10 Yellow=11 LightBlue=12 Magenta=13 Orange=14 White=15 */
type ItemColor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
/** 物品使用方式。Unknown=-1 EquipArmor=0 Eat=1 Attack=2 Consume=3 Throw=4 Shoot=5 Place=6 FillBottle=7 FillBucket=8 PourBucket=9 UseTool=10 Interact=11 Retrieved=12 Dyed=13 Traded=14 BrushingCompleted=15 OpenedVault=16 */
type ItemUseMethod = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
/** 权限变更来源。ProgrammingInterfaceCaused=1 CommandCaused=2 UserInterfaceCaused=3 CocosInterfaceCaused=4 */
type PermissionChangeCause = 1 | 2 | 3 | 4;
/** 玩家动作类型。StartSleeping=5 StopSleeping=6 StartSprinting=9 StopSprinting=10 StartSneaking=11 StopSneaking=12 StartGliding=15 StopGliding=16 StartSwimming=21 StopSwimming=22 StartSpinAttack=23 StopSpinAttack=24 StartCrawling=32 StopCrawling=33 StartFlying=34 StopFlying=35 */
type PlayerActionType = 5 | 6 | 9 | 10 | 11 | 12 | 15 | 16 | 21 | 22 | 23 | 24 | 32 | 33 | 34 | 35;
/** 玩家体力消耗比例。HEAL=0 JUMP=1 SPRINT_JUMP=2 MINE=3 ATTACK=4 GLOBAL=9 */
type PlayerExhaustRatioType = 0 | 1 | 2 | 3 | 4 | 9;
/** 物理作用力模式。eFORCE=0 eIMPULSE=1 eVELOCITY_CHANGE=2 eACCELERATION=3 */
type PxForceMode = 0 | 1 | 2 | 3;
/** 渲染控制器数组类型。Geometry=0 Material=1 Texture=2 */
type RenderControllerArrayType = 0 | 1 | 2;
/** 渲染层。DOUBLE_SIDED=0 .. STRUCTURE_VOID=18 */
type RenderLayer = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;
/** 方块放置来源。MAN_MADE=0 NATURE=1 API=2 */
type SetBlockType = 0 | 1 | 2;
/** 形状类型。BOX=1 LINE=2 CIRCLE=3 ARROW=4 TEXT=5 SPHERE=6 COUNT=7 */
type ShapeType = 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** 结构特征类型。Unknown=0 .. NeteaseLargeFeature=18 */
type StructureFeatureType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;
/** 跨服转移失败原因。TypeNotExist=10 VersionNotExist=11 ServerIsFull=12 VersionNotFix=13 TargetIsFull=14 TargetNotVaild=15 ApiInputFail=16 */
type TransferServerFailReason = 10 | 11 | 12 | 13 | 14 | 15 | 16;
/** UI 基础层。Desk=0 DeskFloat=15000 PopUpLv1=25000 PopUpLv2=45000 PopUpModal=60000 PopUpFloat=75000 */
type UiBaseLayer = 0 | 15000 | 25000 | 45000 | 60000 | 75000;
/** 使用动画。Undefined=0 Eat=1 Drink=2 Block=3 Bow=4 Camera=5 Spear=6 Crossbow=9 Spyglass=10 GoatHorn=11 Brush=12 */
type UseAnimation = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 9 | 10 | 11 | 12;
/** 虚拟世界对象类型。Model=1 Sfx=2 Textboard=3 Particle=4 */
type VirtualWorldObjectType = 1 | 2 | 3 | 4;
/** 行走状态。Walk=1 Sneak=2 Sprint=3 */
type WalkState = 1 | 2 | 3;

// ----------------------------------------------------------------------------
// 枚举值（int 型，值域较大，用 hpl.int 表示）
// ----------------------------------------------------------------------------

/** 实体类型（SDK EntityType）。值域 1~256，如 Player=63、ItemEntity=64 等。 */
type EntityType = hpl.int;
/** 引擎 Actor 类型。 */
type ActorType = hpl.int;
/** 生物群系（SDK BiomeType）。值域 0~193。 */
type BiomeType = hpl.int;
/** 实体组件类型（SDK EntityComponentType）。值域 0~121。 */
type EntityComponentType = hpl.int;
/** 附魔类型（SDK EnchantType）。ArmorAll=0 .. Breach=40、InvalidEnchantment=42、ModEnchant=255。 */
type EnchantType = hpl.int;
/** 附魔槽位（SDK EnchantSlotType，位掩码）。 */
type EnchantSlotType = hpl.int;
/** 玩家 UI 槽位（SDK PlayerUISlot）。值域 0~53。 */
type PlayerUISlot = hpl.int;
/** 开放式容器 ID（SDK OpenContainerId）。 */
type OpenContainerId = hpl.int;

// ----------------------------------------------------------------------------
// 枚举值（str 型）
// ----------------------------------------------------------------------------

/**
 * 伤害来源（SDK ActorDamageCause，字符串枚举）。如 "none" "entity_attack"
 * "projectile" "fall" "fire" "lava" "drowning" "block_explosion" "magic" 等。
 */
type DamageCause = string;
/**
 * 状态效果（SDK EffectType，字符串枚举）。如 "speed" "slowness" "haste"
 * "strength" "instant_health" "regeneration" "resistance" "invisibility" 等。
 */
type EffectType = string;
/** 背包类型（SDK InventoryType）。construction / equipment / items / nature / search */
type InventoryType = string;
/** 实体传送原因（SDK EntityTeleportCause）。 */
type EntityTeleportCause = string;
/** UI 分类（SDK UICategory）。 */
type UICategory = string;
/** 缓动类型（SDK TimeEaseType）。linear / spring / in_quad / out_quad 等。 */
type TimeEaseType = string;
/** 颜色代码（SDK ColorCode）。 */
type ColorCode = string;

// ----------------------------------------------------------------------------
// 事件参数结构（由 mc.163.com_dev 官方文档自动生成）
// ----------------------------------------------------------------------------

interface AchievementCompleteEventArgs { playerId: string; rootNodeId: string; achievementId: string; title: string; description: string; }
interface ActorAcquiredItemClientEventArgs { actor: string; secondaryActor: string; itemDict: ItemDict; acquireMethod: hpl.int; }
interface ActorAcquiredItemServerEventArgs { actor: string; secondaryActor: string; itemDict: ItemDict; acquireMethod: hpl.int; }
interface ActorHurtServerEventArgs { entityId: string; cause: string; damage: hpl.float; absorbedDamage: hpl.int; customTag: string; }
interface ActorUseItemClientEventArgs { playerId: string; itemDict: ItemDict; useMethod: hpl.int; }
interface ActorUseItemServerEventArgs { playerId: string; itemDict: ItemDict; useMethod: hpl.int; }
interface ActuallyHurtServerEventArgs { srcId: string; projectileId: string; entityId: string; damage: hpl.float; invulnerableTime: hpl.int; lastHurt: hpl.float; cause: string; customTag: string; }
interface AddEffectServerEventArgs { entityId: string; effectName: string; effectDuration: hpl.int; effectAmplifier: hpl.int; damage: hpl.float; }
interface AddEntityClientEventArgs { id: string; posX: hpl.float; posY: hpl.float; posZ: hpl.float; dimensionId: hpl.int; isBaby: boolean; engineTypeStr: string; itemName: string; auxValue: hpl.int; }
interface AddEntityServerEventArgs { id: string; posX: hpl.float; posY: hpl.float; posZ: hpl.float; dimensionId: hpl.int; isBaby: boolean; engineTypeStr: string; itemName: string; auxValue: hpl.int; }
interface AddExpEventArgs { id: string; addExp: hpl.int; }
interface AddLevelEventArgs { id: string; addLevel: hpl.int; newLevel: hpl.int; }
interface AddPlayerAOIClientEventArgs { playerId: string; }
interface AddPlayerCreatedClientEventArgs { playerId: string; }
interface AddServerPlayerEventArgs { id: string; isTransfer: boolean; isReconnect: boolean; isPeUser: boolean; transferParam: string; uid: hpl.int; proxyId: hpl.int; }
interface AnvilCreateResultItemAfterClientEventArgs { playerId: string; itemShowName: string; itemDict: ItemDict; oldItemDict: ItemDict; materialItemDict: ItemDict; }
interface ApproachEntityClientEventArgs { playerId: string; entityId: string; }
interface BlockAnimateRandomTickEventArgs { blockPos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; blockName: string; auxData: hpl.int; }
interface BlockDestroyByLiquidServerEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; liquidName: string; blockName: string; auxValue: hpl.int; dimensionId: hpl.int; }
interface BlockLiquidStateChangeAfterServerEventArgs { blockName: string; auxValue: hpl.int; dimension: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; turnLiquid: boolean; }
interface BlockLiquidStateChangeServerEventArgs { blockName: string; auxValue: hpl.int; dimension: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; turnLiquid: boolean; }
interface BlockNeighborChangedServerEventArgs { dimensionId: hpl.int; posX: hpl.int; posY: hpl.int; posZ: hpl.int; blockName: string; auxValue: hpl.int; neighborPosX: hpl.int; neighborPosY: hpl.int; neighborPosZ: hpl.int; fromBlockName: string; fromBlockAuxValue: hpl.int; toBlockName: string; toAuxValue: hpl.int; }
interface BlockRandomTickServerEventArgs { posX: hpl.int; posY: hpl.int; posZ: hpl.int; blockName: string; fullName: string; auxValue: hpl.int; brightness: hpl.int; dimensionId: hpl.int; }
interface BlockRemoveServerEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; fullName: string; auxValue: hpl.int; dimension: hpl.int; }
interface BlockSnowStateChangeAfterServerEventArgs { dimension: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; turnSnow: boolean; setBlockType: hpl.int; }
interface BlockSnowStateChangeServerEventArgs { dimension: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; turnSnow: boolean; setBlockType: hpl.int; }
interface BlockStrengthChangedServerEventArgs { posX: hpl.int; posY: hpl.int; posZ: hpl.int; blockName: string; auxValue: hpl.int; newStrength: hpl.int; oldStrength: hpl.int; dimensionId: hpl.int; }
interface CameraMotionStartClientEventArgs { motionId: hpl.int; }
interface CameraMotionStopClientEventArgs { motionId: hpl.int; remove: boolean; }
interface ChangeLevelUpCostServerEventArgs { level: hpl.int; levelUpCostExp: hpl.int; changed: boolean; }
interface ChangeSwimStateServerEventArgs { entityId: string; formState: boolean; toState: boolean; }
interface ChestBlockTryPairWithServerEventArgs { cancel: boolean; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; otherBlockX: hpl.int; otherBlockY: hpl.int; otherBlockZ: hpl.int; dimensionId: hpl.int; }
interface ChunkAcquireDiscardedClientEventArgs { dimension: hpl.int; chunkPosX: hpl.int; chunkPosZ: hpl.int; }
interface ChunkAcquireDiscardedServerEventArgs { dimension: hpl.int; chunkPosX: hpl.int; chunkPosZ: hpl.int; entities: hpl.slice<string>; blockEntities: hpl.slice<hpl.HplObject>; }
interface ChunkGeneratedServerEventArgs { dimension: hpl.int; chunkPosX: hpl.int; chunkPosZ: hpl.int; blockEntityData: hpl.slice<hpl.HplObject>; }
interface ChunkLoadedClientEventArgs { dimension: hpl.int; chunkPosX: hpl.int; chunkPosZ: hpl.int; }
interface ChunkLoadedServerEventArgs { dimension: hpl.int; chunkPosX: hpl.int; chunkPosZ: hpl.int; blockEntities: hpl.slice<hpl.HplObject>; }
interface ClientBlockUseEventArgs { playerId: string; blockName: string; aux: hpl.int; cancel: boolean; x: hpl.int; y: hpl.int; z: hpl.int; clickX: hpl.float; clickY: hpl.float; clickZ: hpl.float; }
interface ClientItemTryUseEventArgs { playerId: string; itemDict: ItemDict; cancel: boolean; }
interface ClientItemUseOnEventArgs { entityId: string; itemDict: ItemDict; x: hpl.int; y: hpl.int; z: hpl.int; blockName: string; blockAuxValue: hpl.int; face: hpl.int; clickX: hpl.float; clickY: hpl.float; clickZ: hpl.float; ret: boolean; }
interface ClientLoadAddonsFinishServerEventArgs { playerId: string; }
interface ClientShapedRecipeTriggeredEventArgs { recipeId: string; }
interface CommandBlockContainerOpenEventArgs { playerId: string; isBlock: boolean; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; victimId: string; cancel: boolean; }
interface CommandBlockUpdateEventArgs { playerId: string; playerUid: hpl.int; command: string; isBlock: boolean; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; victimId: string; cancel: boolean; }
interface CommandEventArgs { entityId: string; command: string; cancel: boolean; }
interface ContainerItemChangedServerEventArgs { pos: hpl.tuple<readonly [hpl.int, hpl.int, hpl.int]>; containerType: hpl.int; slot: hpl.int; dimensionId: hpl.int; oldItemDict: ItemDict; newItemDict: ItemDict; }
interface CraftItemOutputChangeServerEventArgs { playerId: string; itemDict: ItemDict; screenContainerType: hpl.int; cancel: boolean; }
interface CraftUpdateResultItemClientEventArgs { playerId: string; itemDict: ItemDict; }
interface CustomCommandTriggerServerEventArgs { command: string; args: hpl.slice<hpl.HplObject>; variant: hpl.int; origin: hpl.HplObject; return_failed: boolean; return_msg_key: string; }
interface DamageEventArgs { srcId: string; projectileId: string; entityId: string; damage: hpl.float; absorption: hpl.int; cause: string; knock: boolean; ignite: boolean; customTag: string; }
interface DelServerPlayerEventArgs { id: string; isTransfer: boolean; uid: hpl.int; }
interface DestroyBlockEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; face: hpl.int; fullName: string; auxData: hpl.int; playerId: string; dimensionId: hpl.int; dropEntityIds: hpl.slice<string>; }
interface DimensionChangeClientEventArgs { playerId: string; fromDimensionId: hpl.int; toDimensionId: hpl.int; fromX: hpl.float; fromY: hpl.float; fromZ: hpl.float; toX: hpl.float; toY: hpl.float; toZ: hpl.float; }
interface DimensionChangeFinishClientEventArgs { playerId: string; fromDimensionId: hpl.int; toDimensionId: hpl.int; toPos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; }
interface DimensionChangeFinishServerEventArgs { playerId: string; fromDimensionId: hpl.int; toDimensionId: hpl.int; toPos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; }
interface DimensionChangeServerEventArgs { playerId: string; fromDimensionId: hpl.int; toDimensionId: hpl.int; fromX: hpl.float; fromY: hpl.float; fromZ: hpl.float; toX: hpl.float; toY: hpl.float; toZ: hpl.float; }
interface DirtBlockToGrassBlockServerEventArgs { dimension: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; }
interface EntityChangeDimensionServerEventArgs { entityId: string; fromDimensionId: hpl.int; toDimensionId: hpl.int; fromX: hpl.float; fromY: hpl.float; fromZ: hpl.float; toX: hpl.float; toY: hpl.float; toZ: hpl.float; }
interface EntityDefinitionsEventServerEventArgs { entityId: string; eventName: string; }
interface EntityDieLoottableAfterServerEventArgs { dieEntityId: string; attacker: string; itemList: hpl.slice<ItemDict>; itemEntityIdList: hpl.slice<string>; }
interface EntityDieLoottableServerEventArgs { dieEntityId: string; attacker: string; itemList: hpl.slice<ItemDict>; dirty: boolean; }
interface EntityDroppedItemServerEventArgs { entityId: string; itemDict: ItemDict; itemEntityId: string; }
interface EntityEffectDamageServerEventArgs { entityId: string; damage: hpl.float; attributeBuffType: hpl.int; duration: hpl.float; lifeTimer: hpl.float; isInstantaneous: boolean; cause: string; }
interface EntityLoadScriptEventArgs { args: hpl.slice<hpl.HplObject>; }
interface EntityModelChangedClientEventArgs { entityId: string; newModel: string; oldModel: string; }
interface EntityMotionStartServerEventArgs { motionId: hpl.int; entityId: string; }
interface EntityMotionStopServerEventArgs { motionId: hpl.int; entityId: string; remove: boolean; }
interface EntityPickupItemServerEventArgs { entityId: string; itemDict: ItemDict; secondaryActor: string; }
interface EntityPlaceBlockAfterServerEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; fullName: string; auxData: hpl.int; entityId: string; dimensionId: hpl.int; face: hpl.int; }
interface EntityRemoveEventArgs { id: string; }
interface EntityStartRidingEventArgs { id: string; rideId: string; }
interface EntityStopRidingEventArgs { id: string; rideId: string; exitFromRider: boolean; entityIsBeingDestroyed: boolean; switchingRides: boolean; cancel: boolean; }
interface EntityTickServerEventArgs { entityId: string; identifier: string; }
interface ExplosionServerEventArgs { blocks: hpl.slice<hpl.HplObject>; victims: hpl.slice<hpl.HplObject>; sourceId: string; explodePos: hpl.slice<hpl.HplObject>; dimensionId: hpl.int; }
interface ExtinguishFireClientEventArgs { pos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; playerId: string; cancel: boolean; }
interface ExtinguishFireServerEventArgs { pos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; playerId: string; cancel: boolean; }
interface FallingBlockBreakServerEventArgs { fallingBlockId: string; fallingBlockX: hpl.float; fallingBlockY: hpl.float; fallingBlockZ: hpl.float; blockName: string; fallTickAmount: hpl.int; dimensionId: hpl.int; cancelDrop: boolean; }
interface FallingBlockCauseDamageBeforeClientEventArgs { fallingBlockId: hpl.int; fallingBlockX: hpl.float; fallingBlockY: hpl.float; fallingBlockZ: hpl.float; blockName: string; dimensionId: hpl.int; collidingEntitys: hpl.slice<string>; fallTickAmount: hpl.int; fallDistance: hpl.float; isHarmful: boolean; fallDamage: hpl.int; }
interface FallingBlockCauseDamageBeforeServerEventArgs { fallingBlockId: string; fallingBlockX: hpl.float; fallingBlockY: hpl.float; fallingBlockZ: hpl.float; blockName: string; dimensionId: hpl.int; collidingEntitys: hpl.slice<string>; fallTickAmount: hpl.int; fallDistance: hpl.float; isHarmful: boolean; fallDamage: hpl.int; }
interface FallingBlockReturnHeavyBlockServerEventArgs { fallingBlockId: hpl.int; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; heavyBlockName: string; prevHereBlockName: string; dimensionId: hpl.int; fallTickAmount: hpl.int; }
interface FarmBlockToDirtBlockServerEventArgs { dimension: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; setBlockType: hpl.int; }
interface FurnaceBurnFinishedServerEventArgs { dimensionId: hpl.int; posX: hpl.float; posY: hpl.float; posZ: hpl.float; itemDict: ItemDict; }
interface GameRenderTickEventArgs extends hpl.HplObject {}
interface GameTypeChangedClientEventArgs { playerId: string; oldGameType: hpl.int; newGameType: hpl.int; }
interface GameTypeChangedServerEventArgs { playerId: string; oldGameType: hpl.int; newGameType: hpl.int; }
interface GlobalCommandServerEventArgs { entityId: string; command: string; blockPos: hpl.tuple<readonly [hpl.int, hpl.int, hpl.int]>; dimension: hpl.int; cancel: boolean; }
interface GrassBlockToDirtBlockServerEventArgs { dimension: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; }
interface GrindStoneRemovedEnchantClientEventArgs { playerId: string; oldItemDict: ItemDict; additionalItemDict: ItemDict; newItemDict: ItemDict; exp: hpl.int; }
interface HealthChangeBeforeServerEventArgs { entityId: string; from: hpl.float; to: hpl.float; byScript: boolean; cancel: boolean; }
interface HealthChangeClientEventArgs { entityId: string; from: hpl.float; to: hpl.float; }
interface HealthChangeServerEventArgs { entityId: string; from: hpl.float; to: hpl.float; byScript: boolean; }
interface HeavyBlockStartFallingServerEventArgs { fallingBlockId: string; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; dimensionId: hpl.int; }
interface HopperTryPullInServerEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; abovePosX: hpl.int; abovePosY: hpl.int; abovePosZ: hpl.int; dimensionId: hpl.int; canHopper: boolean; }
interface HopperTryPullOutServerEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; attachedPosX: hpl.int; attachedPosY: hpl.int; attachedPosZ: hpl.int; dimensionId: hpl.int; canHopper: boolean; }
interface InventoryItemChangedClientEventArgs { playerId: string; slot: hpl.int; oldItemDict: ItemDict; newItemDict: ItemDict; }
interface InventoryItemChangedServerEventArgs { playerId: string; slot: hpl.int; oldItemDict: ItemDict; newItemDict: ItemDict; }
interface ItemDurabilityChangedServerEventArgs { entityId: string; itemDict: ItemDict; durabilityBefore: hpl.int; durability: hpl.int; canChange: boolean; }
interface ItemPullOutCustomContainerServerEventArgs { itemDict: ItemDict; collectionName: string; collectionIndex: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; dimension: hpl.int; cancel: boolean; }
interface ItemPushInCustomContainerServerEventArgs { itemDict: ItemDict; collectionName: string; collectionIndex: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; dimension: hpl.int; cancel: boolean; }
interface ItemReleaseUsingClientEventArgs { playerId: string; durationLeft: hpl.float; itemDict: ItemDict; maxUseDuration: hpl.int; cancel: boolean; }
interface ItemReleaseUsingServerEventArgs { playerId: string; durationLeft: hpl.float; itemDict: ItemDict; maxUseDuration: hpl.int; cancel: boolean; changeItem: boolean; }
interface ItemUseAfterServerEventArgs { entityId: string; itemDict: ItemDict; }
interface ItemUseOnAfterServerEventArgs { entityId: string; itemDict: ItemDict; x: hpl.int; y: hpl.int; z: hpl.int; face: hpl.int; clickX: hpl.float; clickY: hpl.float; clickZ: hpl.float; blockName: string; blockAuxValue: hpl.int; dimensionId: hpl.int; }
interface LeaveEntityClientEventArgs { playerId: string; entityId: string; }
interface LiquidClippedClientEventArgs { playerId: string; blockName: string; aux: hpl.int; blockPos: hpl.tuple<readonly [hpl.int, hpl.int, hpl.int]>; dimensionId: hpl.int; floatPos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; }
interface LiquidClippedServerEventArgs { playerId: string; blockName: string; aux: hpl.int; blockPos: hpl.tuple<readonly [hpl.int, hpl.int, hpl.int]>; dimensionId: hpl.int; floatPos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; }
interface LoadClientAddonScriptsAfterEventArgs extends hpl.HplObject {}
interface LoadServerAddonScriptsAfterEventArgs extends hpl.HplObject {}
interface MobDieEventArgs { id: string; attacker: string; cause: string; customTag: string; }
interface MobGriefingBlockServerEventArgs { cancel: boolean; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; entityId: string; blockName: string; dimensionId: hpl.int; }
interface ModBlockEntityLoadedClientEventArgs { posX: hpl.int; posY: hpl.int; posZ: hpl.int; dimensionId: hpl.int; blockName: string; }
interface ModBlockEntityRemoveClientEventArgs { posX: hpl.int; posY: hpl.int; posZ: hpl.int; dimensionId: hpl.int; blockName: string; }
interface ModBlockEntityTickClientEventArgs { posX: hpl.int; posY: hpl.int; posZ: hpl.int; dimensionId: hpl.int; blockName: string; }
interface MountTamingEventArgs { eid: string; pid: string; }
interface NewOnEntityAreaEventArgs { name: string; enteredEntities: hpl.slice<string>; leftEntities: hpl.slice<string>; }
interface OnAfterFallOnBlockClientEventArgs { entityId: string; posX: hpl.float; posY: hpl.float; posZ: hpl.float; motionX: hpl.float; motionY: hpl.float; motionZ: hpl.float; blockName: string; calculate: boolean; }
interface OnAfterFallOnBlockServerEventArgs { entityId: string; posX: hpl.float; posY: hpl.float; posZ: hpl.float; motionX: hpl.float; motionY: hpl.float; motionZ: hpl.float; blockName: string; calculate: boolean; }
interface OnBeforeFallOnBlockServerEventArgs { entityId: string; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; fallDistance: hpl.float; cancel: boolean; }
interface OnCarriedNewItemChangedClientEventArgs { itemDict: ItemDict; }
interface OnCarriedNewItemChangedServerEventArgs { oldItemDict: ItemDict; newItemDict: ItemDict; playerId: string; }
interface OnCommandOutputClientEventArgs { command: string; message: string; }
interface OnCommandOutputServerEventArgs { command: string; message: string; }
interface OnContainerFillLoottableServerEventArgs { loottable: string; playerId: string; itemList: hpl.slice<ItemDict>; dirty: boolean; }
interface OnEntityInsideBlockClientEventArgs { entityId: string; dimensionId: hpl.int; slowdownMultiX: hpl.float; slowdownMultiY: hpl.float; slowdownMultiZ: hpl.float; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; cancel: boolean; }
interface OnEntityInsideBlockServerEventArgs { entityId: string; slowdownMultiX: hpl.float; slowdownMultiY: hpl.float; slowdownMultiZ: hpl.float; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; cancel: boolean; }
interface OnFireHurtEventArgs { victim: string; src: string; fireTime: hpl.float; cancel: boolean; cancelIgnite: boolean; }
interface OnGroundClientEventArgs { id: string; }
interface OnGroundServerEventArgs { id: string; }
interface OnItemPutInEnchantingModelServerEventArgs { playerId: string; slotType: hpl.int; options: hpl.slice<hpl.HplObject>; change: boolean; }
interface OnKnockBackServerEventArgs { id: string; }
interface OnLightningLevelChangeServerEventArgs { oldLevel: hpl.float; newLevel: hpl.float; }
interface OnLocalLightningLevelChangeServerEventArgs { oldLevel: hpl.float; newLevel: hpl.float; dimensionId: hpl.int; }
interface OnLocalPlayerActionClientEventArgs { actionType: hpl.int; }
interface OnLocalPlayerStartJumpClientEventArgs extends hpl.HplObject {}
interface OnLocalPlayerStopLoadingEventArgs { playerId: string; }
interface OnLocalRainLevelChangeServerEventArgs { oldLevel: hpl.float; newLevel: hpl.float; dimensionId: hpl.int; }
interface OnMobHitBlockServerEventArgs { entityId: string; posX: hpl.int; posY: hpl.int; posZ: hpl.int; blockId: string; auxValue: hpl.int; dimensionId: hpl.int; }
interface OnMobHitMobClientEventArgs { mobId: string; hittedMobList: hpl.slice<string>; }
interface OnMobHitMobServerEventArgs { mobId: string; hittedMobList: hpl.slice<string>; }
interface OnModBlockNeteaseEffectCreatedClientEventArgs { effectName: string; id: hpl.int; effectType: hpl.int; blockPos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; }
interface OnNewArmorExchangeServerEventArgs { slot: hpl.int; oldArmorDict: hpl.HplObject; newArmorDict: hpl.HplObject; playerId: string; }
interface OnOffhandItemChangedServerEventArgs { oldItemDict: ItemDict; newItemDict: ItemDict; playerId: string; }
interface OnPlayerActionServerEventArgs { playerId: string; actionType: hpl.int; }
interface OnPlayerActiveShieldServerEventArgs { playerId: string; isActive: boolean; itemDict: ItemDict; cancelable: boolean; cancel: boolean; }
interface OnPlayerBlockedByShieldAfterServerEventArgs { playerId: string; sourceId: string; itemDict: ItemDict; damage: hpl.float; }
interface OnPlayerBlockedByShieldBeforeServerEventArgs { playerId: string; sourceId: string; itemDict: ItemDict; damage: hpl.float; }
interface OnPlayerHitBlockClientEventArgs { playerId: string; posX: hpl.int; posY: hpl.int; posZ: hpl.int; blockId: string; auxValue: hpl.int; }
interface OnPlayerHitBlockServerEventArgs { playerId: string; posX: hpl.int; posY: hpl.int; posZ: hpl.int; blockId: string; auxValue: hpl.int; dimensionId: hpl.int; }
interface OnRainLevelChangeServerEventArgs { oldLevel: hpl.float; newLevel: hpl.float; }
interface OnScriptTickClientEventArgs extends hpl.HplObject {}
interface OnScriptTickServerEventArgs extends hpl.HplObject {}
interface OnStandOnBlockClientEventArgs { entityId: string; dimensionId: hpl.int; posX: hpl.float; posY: hpl.float; posZ: hpl.float; motionX: hpl.float; motionY: hpl.float; motionZ: hpl.float; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; cancel: boolean; }
interface OnStandOnBlockServerEventArgs { entityId: string; dimensionId: hpl.int; posX: hpl.float; posY: hpl.float; posZ: hpl.float; motionX: hpl.float; motionY: hpl.float; motionZ: hpl.float; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; cancel: boolean; }
interface PerspChangeClientEventArgs { from: hpl.int; to: hpl.int; }
interface PistonActionServerEventArgs { cancel: boolean; action: string; pistonFacing: hpl.int; pistonMoveFacing: hpl.int; dimensionId: hpl.int; pistonX: hpl.int; pistonY: hpl.int; pistonZ: hpl.int; blockList: hpl.slice<hpl.HplObject>; breakBlockList: hpl.slice<hpl.HplObject>; entityList: hpl.slice<string>; }
interface PlaceNeteaseLargeFeatureServerEventArgs { dimensionId: hpl.int; pos: hpl.HplObject; rot: hpl.int; depth: hpl.int; centerPool: string; ignoreFitInContext: boolean; cancel: boolean; }
interface PlaceNeteaseStructureFeatureEventArgs { structureName: string; x: hpl.int; y: hpl.int; z: hpl.int; biomeType: hpl.int; biomeName: string; dimensionId: hpl.int; cancel: boolean; }
interface PlayerAddCustomContainerItemClientEventArgs { beforeItemDict: ItemDict; changedItemDict: ItemDict; afterItemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerAddCustomContainerItemServerEventArgs { beforeItemDict: ItemDict; changedItemDict: ItemDict; afterItemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; playerId: string; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerAttackEntityEventArgs { playerId: string; victimId: string; damage: hpl.float; isValid: hpl.int; cancel: boolean; isKnockBack: boolean; isCrit: boolean; }
interface PlayerCheatSpinAttackServerEventArgs { playerId: string; isStart: boolean; }
interface PlayerDieEventArgs { id: string; attacker: string; customTag: string; cause: string; }
interface PlayerDoInteractServerEventArgs { playerId: string; itemDict: ItemDict; interactEntityId: string; }
interface PlayerDropItemServerEventArgs { playerId: string; itemEntityId: string; }
interface PlayerEatFoodServerEventArgs { playerId: string; itemDict: ItemDict; hunger: hpl.int; nutrition: hpl.float; }
interface PlayerFeedEntityServerEventArgs { playerId: string; entityId: string; itemDict: ItemDict; cancel: boolean; }
interface PlayerFishingAfterServerEventArgs { playerId: string; hookEntity: string; itemDict: ItemDict; itemList: hpl.slice<ItemDict>; itemEntityIdList: hpl.slice<string>; }
interface PlayerFishingServerEventArgs { playerId: string; hookEntity: string; itemDict: ItemDict; itemList: hpl.slice<ItemDict>; itemChange: boolean; cancel: boolean; }
interface PlayerHungerChangeServerEventArgs { playerId: string; hungerBefore: hpl.float; hunger: hpl.float; cancel: boolean; }
interface PlayerHurtEventArgs { id: string; attacker: string; customTag: string; cause: string; }
interface PlayerIntendLeaveServerEventArgs { playerId: string; }
interface PlayerInteractServerEventArgs { cancel: boolean; playerId: string; itemDict: ItemDict; victimId: string; }
interface PlayerJoinMessageEventArgs { id: string; name: string; cancel: boolean; message: string; }
interface PlayerLeftMessageServerEventArgs { id: string; name: string; cancel: boolean; message: string; }
interface PlayerNamedEntityServerEventArgs { playerId: string; entityId: string; preName: string; afterName: string; cancel: boolean; }
interface PlayerPermissionChangeClientEventArgs { causePlayerId: string; playerId: string; oldPermission: PermissionDict; newPermission: PermissionDict; changeCause: hpl.int; }
interface PlayerPermissionChangeServerEventArgs { causePlayerId: string; playerId: string; oldPermission: PermissionDict; newPermission: PermissionDict; changeCause: hpl.int; cancel: boolean; }
interface PlayerPickupArrowServerEventArgs { playerId: string; arrowId: string; itemDict: ItemDict; cancel: boolean; pickupDelay: hpl.int; }
interface PlayerRemoveCustomContainerItemClientEventArgs { beforeItemDict: ItemDict; changedItemDict: ItemDict; afterItemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerRemoveCustomContainerItemServerEventArgs { beforeItemDict: ItemDict; changedItemDict: ItemDict; afterItemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; playerId: string; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerRespawnEventArgs { id: string; }
interface PlayerRespawnFinishServerEventArgs { playerId: string; }
interface PlayerSleepServerEventArgs { playerId: string; fullName: string; auxData: hpl.int; dimensionid: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerSpinAttackServerEventArgs { playerId: string; isInWaterOrRain: boolean; isRiding: boolean; isStart: boolean; }
interface PlayerStartFishingServerEventArgs { playerId: string; hookEntity: string; itemDict: ItemDict; cancel: boolean; }
interface PlayerStopSleepServerEventArgs { playerId: string; fullName: string; auxData: hpl.int; dimensionid: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerTeleportEventArgs { id: string; }
interface PlayerTryAddCustomContainerItemClientEventArgs { itemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; cancel: boolean; }
interface PlayerTryAddCustomContainerItemServerEventArgs { itemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; playerId: string; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerTryDestroyBlockClientEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; face: hpl.int; blockName: string; auxData: hpl.int; playerId: string; cancel: boolean; }
interface PlayerTryDropItemClientEventArgs { playerId: string; itemDict: ItemDict; cancel: boolean; }
interface PlayerTryPutCustomContainerItemClientEventArgs { itemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; cancel: boolean; }
interface PlayerTryPutCustomContainerItemServerEventArgs { itemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; playerId: string; x: hpl.int; y: hpl.int; z: hpl.int; cancel: boolean; }
interface PlayerTryRemoveCustomContainerItemClientEventArgs { itemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; x: hpl.int; y: hpl.int; z: hpl.int; cancel: boolean; }
interface PlayerTryRemoveCustomContainerItemServerEventArgs { itemDict: ItemDict; collectionName: string; collectionType: string; collectionIndex: hpl.int; playerId: string; x: hpl.int; y: hpl.int; z: hpl.int; }
interface PlayerTrySleepServerEventArgs { playerId: string; cancel: boolean; }
interface ProjectileCritHitEventArgs { id: string; targetId: string; }
interface ProjectileDoHitEffectEventArgs { id: string; hitTargetType: string; targetId: string; hitFace: hpl.int; x: hpl.float; y: hpl.float; z: hpl.float; blockPosX: hpl.int; blockPosY: hpl.int; blockPosZ: hpl.int; srcId: string; cancel: boolean; }
interface RefreshEffectServerEventArgs { entityId: string; effectName: string; effectDuration: hpl.int; effectAmplifier: hpl.int; damage: hpl.float; }
interface RemoveEffectServerEventArgs { entityId: string; effectName: string; effectDuration: hpl.int; effectAmplifier: hpl.int; }
interface RemoveEntityClientEventArgs { id: string; }
interface RemovePlayerAOIClientEventArgs { playerId: string; }
interface ServerBlockEntityTickEventArgs { blockName: string; dimension: hpl.int; posX: hpl.int; posY: hpl.int; posZ: hpl.int; }
interface ServerBlockUseEventArgs { playerId: string; blockName: string; aux: hpl.int; cancel: boolean; x: hpl.int; y: hpl.int; z: hpl.int; clickX: hpl.float; clickY: hpl.float; clickZ: hpl.float; face: hpl.int; itemDict: ItemDict; dimensionId: hpl.int; }
interface ServerChatEventArgs { username: string; playerId: string; message: string; cancel: boolean; bChatById: boolean; bForbid: boolean; toPlayerIds: hpl.slice<string>; gameChatPrefix: string; gameChatPrefixColorR: hpl.float; gameChatPrefixColorG: hpl.float; gameChatPrefixColorB: hpl.float; }
interface ServerEntityTryPlaceBlockEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; fullName: string; auxData: hpl.int; entityId: string; dimensionId: hpl.int; face: hpl.int; cancel: boolean; clickX: hpl.float; clickY: hpl.float; clickZ: hpl.float; }
interface ServerItemTryUseEventArgs { playerId: string; itemDict: ItemDict; cancel: boolean; }
interface ServerItemUseOnEventArgs { entityId: string; itemDict: ItemDict; x: hpl.int; y: hpl.int; z: hpl.int; blockName: string; blockAuxValue: hpl.int; face: hpl.int; dimensionId: hpl.int; clickX: hpl.float; clickY: hpl.float; clickZ: hpl.float; ret: boolean; }
interface ServerPlaceBlockEntityEventArgs { blockName: string; dimension: hpl.int; posX: hpl.int; posY: hpl.int; posZ: hpl.int; }
interface ServerPlayerGetExperienceOrbEventArgs { playerId: string; experienceValue: hpl.int; cancel: boolean; }
interface ServerPlayerTryDestroyBlockEventArgs { x: hpl.int; y: hpl.int; z: hpl.int; face: hpl.int; fullName: string; auxData: hpl.int; playerId: string; dimensionId: hpl.int; cancel: boolean; spawnResources: boolean; }
interface ServerPlayerTryTouchEventArgs { playerId: string; entityId: string; itemDict: ItemDict; cancel: boolean; pickupDelay: hpl.int; }
interface ServerPostBlockPatternEventArgs { entityId: string; entityGenerated: string; x: hpl.int; y: hpl.int; z: hpl.int; dimensionId: hpl.int; }
interface ServerPreBlockPatternEventArgs { enable: boolean; x: hpl.int; y: hpl.int; z: hpl.int; dimensionId: hpl.int; entityWillBeGenerated: string; }
interface ServerSpawnMobEventArgs { entityId: string; identifier: string; type: hpl.int; baby: boolean; x: hpl.float; y: hpl.float; z: hpl.float; dimensionId: hpl.int; realIdentifier: string; cancel: boolean; }
interface ShearsDestoryBlockBeforeClientEventArgs { blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; auxData: hpl.int; dropName: string; dropCount: hpl.int; playerId: string; dimensionId: hpl.int; cancelShears: boolean; }
interface ShearsDestoryBlockBeforeServerEventArgs { blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; auxData: hpl.int; dropName: string; dropCount: hpl.int; playerId: string; dimensionId: hpl.int; cancelShears: boolean; }
interface ShearsUseToBlockBeforeServerEventArgs { blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; blockName: string; auxData: hpl.int; dropName: string; dropCount: hpl.int; entityId: string; dimensionId: hpl.int; cancelShears: boolean; }
interface SpawnProjectileServerEventArgs { projectileId: string; projectileIdentifier: string; spawnerId: string; }
interface StartDestroyBlockClientEventArgs { pos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; blockName: string; auxValue: hpl.int; playerId: string; cancel: boolean; face: hpl.int; }
interface StartDestroyBlockServerEventArgs { pos: hpl.tuple<readonly [hpl.float, hpl.float, hpl.float]>; blockName: string; auxValue: hpl.int; playerId: string; dimensionId: hpl.int; cancel: boolean; face: hpl.int; }
interface StartRidingClientEventArgs { actorId: string; victimId: string; }
interface StartRidingServerEventArgs { cancel: boolean; actorId: string; victimId: string; }
interface StartUsingItemClientEventArgs { playerId: string; itemDict: ItemDict; }
interface StepOffBlockClientEventArgs { blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; entityId: string; blockName: string; dimensionId: hpl.int; }
interface StepOffBlockServerEventArgs { blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; entityId: string; blockName: string; dimensionId: hpl.int; }
interface StepOnBlockClientEventArgs { cancel: boolean; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; entityId: string; blockName: string; dimensionId: hpl.int; }
interface StepOnBlockServerEventArgs { cancel: boolean; blockX: hpl.int; blockY: hpl.int; blockZ: hpl.int; entityId: string; blockName: string; dimensionId: hpl.int; }
interface StopUsingItemClientEventArgs { playerId: string; itemDict: ItemDict; }
interface StoreBuySuccServerEventArgs { playerId: string; }
interface UIContainerItemChangedServerEventArgs { playerId: string; slot: hpl.int; oldItemDict: ItemDict; newItemDict: ItemDict; }
interface UnLoadClientAddonScriptsBeforeEventArgs extends hpl.HplObject {}
interface UpdatePlayerSkinClientEventArgs { playerId: string; }
interface WillAddEffectServerEventArgs { entityId: string; effectName: string; effectDuration: hpl.int; effectAmplifier: hpl.int; cancel: boolean; damage: hpl.float; }
interface WillTeleportToServerEventArgs { cancel: boolean; entityId: string; fromDimensionId: hpl.int; toDimensionId: hpl.int; fromX: hpl.int; fromY: hpl.int; fromZ: hpl.int; toX: hpl.int; toY: hpl.int; toZ: hpl.int; cause: string; }

interface EventNameArgs {
  AchievementCompleteEvent: AchievementCompleteEventArgs;
  ActorAcquiredItemClientEvent: ActorAcquiredItemClientEventArgs;
  ActorAcquiredItemServerEvent: ActorAcquiredItemServerEventArgs;
  ActorHurtServerEvent: ActorHurtServerEventArgs;
  ActorUseItemClientEvent: ActorUseItemClientEventArgs;
  ActorUseItemServerEvent: ActorUseItemServerEventArgs;
  ActuallyHurtServerEvent: ActuallyHurtServerEventArgs;
  AddEffectServerEvent: AddEffectServerEventArgs;
  AddEntityClientEvent: AddEntityClientEventArgs;
  AddEntityServerEvent: AddEntityServerEventArgs;
  AddExpEvent: AddExpEventArgs;
  AddLevelEvent: AddLevelEventArgs;
  AddPlayerAOIClientEvent: AddPlayerAOIClientEventArgs;
  AddPlayerCreatedClientEvent: AddPlayerCreatedClientEventArgs;
  AddServerPlayerEvent: AddServerPlayerEventArgs;
  AnvilCreateResultItemAfterClientEvent: AnvilCreateResultItemAfterClientEventArgs;
  ApproachEntityClientEvent: ApproachEntityClientEventArgs;
  BlockAnimateRandomTickEvent: BlockAnimateRandomTickEventArgs;
  BlockDestroyByLiquidServerEvent: BlockDestroyByLiquidServerEventArgs;
  BlockLiquidStateChangeAfterServerEvent: BlockLiquidStateChangeAfterServerEventArgs;
  BlockLiquidStateChangeServerEvent: BlockLiquidStateChangeServerEventArgs;
  BlockNeighborChangedServerEvent: BlockNeighborChangedServerEventArgs;
  BlockRandomTickServerEvent: BlockRandomTickServerEventArgs;
  BlockRemoveServerEvent: BlockRemoveServerEventArgs;
  BlockSnowStateChangeAfterServerEvent: BlockSnowStateChangeAfterServerEventArgs;
  BlockSnowStateChangeServerEvent: BlockSnowStateChangeServerEventArgs;
  BlockStrengthChangedServerEvent: BlockStrengthChangedServerEventArgs;
  CameraMotionStartClientEvent: CameraMotionStartClientEventArgs;
  CameraMotionStopClientEvent: CameraMotionStopClientEventArgs;
  ChangeLevelUpCostServerEvent: ChangeLevelUpCostServerEventArgs;
  ChangeSwimStateServerEvent: ChangeSwimStateServerEventArgs;
  ChestBlockTryPairWithServerEvent: ChestBlockTryPairWithServerEventArgs;
  ChunkAcquireDiscardedClientEvent: ChunkAcquireDiscardedClientEventArgs;
  ChunkAcquireDiscardedServerEvent: ChunkAcquireDiscardedServerEventArgs;
  ChunkGeneratedServerEvent: ChunkGeneratedServerEventArgs;
  ChunkLoadedClientEvent: ChunkLoadedClientEventArgs;
  ChunkLoadedServerEvent: ChunkLoadedServerEventArgs;
  ClientBlockUseEvent: ClientBlockUseEventArgs;
  ClientItemTryUseEvent: ClientItemTryUseEventArgs;
  ClientItemUseOnEvent: ClientItemUseOnEventArgs;
  ClientLoadAddonsFinishServerEvent: ClientLoadAddonsFinishServerEventArgs;
  ClientShapedRecipeTriggeredEvent: ClientShapedRecipeTriggeredEventArgs;
  CommandBlockContainerOpenEvent: CommandBlockContainerOpenEventArgs;
  CommandBlockUpdateEvent: CommandBlockUpdateEventArgs;
  CommandEvent: CommandEventArgs;
  ContainerItemChangedServerEvent: ContainerItemChangedServerEventArgs;
  CraftItemOutputChangeServerEvent: CraftItemOutputChangeServerEventArgs;
  CraftUpdateResultItemClientEvent: CraftUpdateResultItemClientEventArgs;
  CustomCommandTriggerServerEvent: CustomCommandTriggerServerEventArgs;
  DamageEvent: DamageEventArgs;
  DelServerPlayerEvent: DelServerPlayerEventArgs;
  DestroyBlockEvent: DestroyBlockEventArgs;
  DimensionChangeClientEvent: DimensionChangeClientEventArgs;
  DimensionChangeFinishClientEvent: DimensionChangeFinishClientEventArgs;
  DimensionChangeFinishServerEvent: DimensionChangeFinishServerEventArgs;
  DimensionChangeServerEvent: DimensionChangeServerEventArgs;
  DirtBlockToGrassBlockServerEvent: DirtBlockToGrassBlockServerEventArgs;
  EntityChangeDimensionServerEvent: EntityChangeDimensionServerEventArgs;
  EntityDefinitionsEventServerEvent: EntityDefinitionsEventServerEventArgs;
  EntityDieLoottableAfterServerEvent: EntityDieLoottableAfterServerEventArgs;
  EntityDieLoottableServerEvent: EntityDieLoottableServerEventArgs;
  EntityDroppedItemServerEvent: EntityDroppedItemServerEventArgs;
  EntityEffectDamageServerEvent: EntityEffectDamageServerEventArgs;
  EntityLoadScriptEvent: EntityLoadScriptEventArgs;
  EntityModelChangedClientEvent: EntityModelChangedClientEventArgs;
  EntityMotionStartServerEvent: EntityMotionStartServerEventArgs;
  EntityMotionStopServerEvent: EntityMotionStopServerEventArgs;
  EntityPickupItemServerEvent: EntityPickupItemServerEventArgs;
  EntityPlaceBlockAfterServerEvent: EntityPlaceBlockAfterServerEventArgs;
  EntityRemoveEvent: EntityRemoveEventArgs;
  EntityStartRidingEvent: EntityStartRidingEventArgs;
  EntityStopRidingEvent: EntityStopRidingEventArgs;
  EntityTickServerEvent: EntityTickServerEventArgs;
  ExplosionServerEvent: ExplosionServerEventArgs;
  ExtinguishFireClientEvent: ExtinguishFireClientEventArgs;
  ExtinguishFireServerEvent: ExtinguishFireServerEventArgs;
  FallingBlockBreakServerEvent: FallingBlockBreakServerEventArgs;
  FallingBlockCauseDamageBeforeClientEvent: FallingBlockCauseDamageBeforeClientEventArgs;
  FallingBlockCauseDamageBeforeServerEvent: FallingBlockCauseDamageBeforeServerEventArgs;
  FallingBlockReturnHeavyBlockServerEvent: FallingBlockReturnHeavyBlockServerEventArgs;
  FarmBlockToDirtBlockServerEvent: FarmBlockToDirtBlockServerEventArgs;
  FurnaceBurnFinishedServerEvent: FurnaceBurnFinishedServerEventArgs;
  GameRenderTickEvent: GameRenderTickEventArgs;
  GameTypeChangedClientEvent: GameTypeChangedClientEventArgs;
  GameTypeChangedServerEvent: GameTypeChangedServerEventArgs;
  GlobalCommandServerEvent: GlobalCommandServerEventArgs;
  GrassBlockToDirtBlockServerEvent: GrassBlockToDirtBlockServerEventArgs;
  GrindStoneRemovedEnchantClientEvent: GrindStoneRemovedEnchantClientEventArgs;
  HealthChangeBeforeServerEvent: HealthChangeBeforeServerEventArgs;
  HealthChangeClientEvent: HealthChangeClientEventArgs;
  HealthChangeServerEvent: HealthChangeServerEventArgs;
  HeavyBlockStartFallingServerEvent: HeavyBlockStartFallingServerEventArgs;
  HopperTryPullInServerEvent: HopperTryPullInServerEventArgs;
  HopperTryPullOutServerEvent: HopperTryPullOutServerEventArgs;
  InventoryItemChangedClientEvent: InventoryItemChangedClientEventArgs;
  InventoryItemChangedServerEvent: InventoryItemChangedServerEventArgs;
  ItemDurabilityChangedServerEvent: ItemDurabilityChangedServerEventArgs;
  ItemPullOutCustomContainerServerEvent: ItemPullOutCustomContainerServerEventArgs;
  ItemPushInCustomContainerServerEvent: ItemPushInCustomContainerServerEventArgs;
  ItemReleaseUsingClientEvent: ItemReleaseUsingClientEventArgs;
  ItemReleaseUsingServerEvent: ItemReleaseUsingServerEventArgs;
  ItemUseAfterServerEvent: ItemUseAfterServerEventArgs;
  ItemUseOnAfterServerEvent: ItemUseOnAfterServerEventArgs;
  LeaveEntityClientEvent: LeaveEntityClientEventArgs;
  LiquidClippedClientEvent: LiquidClippedClientEventArgs;
  LiquidClippedServerEvent: LiquidClippedServerEventArgs;
  LoadClientAddonScriptsAfter: LoadClientAddonScriptsAfterEventArgs;
  LoadServerAddonScriptsAfter: LoadServerAddonScriptsAfterEventArgs;
  MobDieEvent: MobDieEventArgs;
  MobGriefingBlockServerEvent: MobGriefingBlockServerEventArgs;
  ModBlockEntityLoadedClientEvent: ModBlockEntityLoadedClientEventArgs;
  ModBlockEntityRemoveClientEvent: ModBlockEntityRemoveClientEventArgs;
  ModBlockEntityTickClientEvent: ModBlockEntityTickClientEventArgs;
  MountTamingEvent: MountTamingEventArgs;
  NewOnEntityAreaEvent: NewOnEntityAreaEventArgs;
  OnAfterFallOnBlockClientEvent: OnAfterFallOnBlockClientEventArgs;
  OnAfterFallOnBlockServerEvent: OnAfterFallOnBlockServerEventArgs;
  OnBeforeFallOnBlockServerEvent: OnBeforeFallOnBlockServerEventArgs;
  OnCarriedNewItemChangedClientEvent: OnCarriedNewItemChangedClientEventArgs;
  OnCarriedNewItemChangedServerEvent: OnCarriedNewItemChangedServerEventArgs;
  OnCommandOutputClientEvent: OnCommandOutputClientEventArgs;
  OnCommandOutputServerEvent: OnCommandOutputServerEventArgs;
  OnContainerFillLoottableServerEvent: OnContainerFillLoottableServerEventArgs;
  OnEntityInsideBlockClientEvent: OnEntityInsideBlockClientEventArgs;
  OnEntityInsideBlockServerEvent: OnEntityInsideBlockServerEventArgs;
  OnFireHurtEvent: OnFireHurtEventArgs;
  OnGroundClientEvent: OnGroundClientEventArgs;
  OnGroundServerEvent: OnGroundServerEventArgs;
  OnItemPutInEnchantingModelServerEvent: OnItemPutInEnchantingModelServerEventArgs;
  OnKnockBackServerEvent: OnKnockBackServerEventArgs;
  OnLightningLevelChangeServerEvent: OnLightningLevelChangeServerEventArgs;
  OnLocalLightningLevelChangeServerEvent: OnLocalLightningLevelChangeServerEventArgs;
  OnLocalPlayerActionClientEvent: OnLocalPlayerActionClientEventArgs;
  OnLocalPlayerStartJumpClientEvent: OnLocalPlayerStartJumpClientEventArgs;
  OnLocalPlayerStopLoading: OnLocalPlayerStopLoadingEventArgs;
  OnLocalRainLevelChangeServerEvent: OnLocalRainLevelChangeServerEventArgs;
  OnMobHitBlockServerEvent: OnMobHitBlockServerEventArgs;
  OnMobHitMobClientEvent: OnMobHitMobClientEventArgs;
  OnMobHitMobServerEvent: OnMobHitMobServerEventArgs;
  OnModBlockNeteaseEffectCreatedClientEvent: OnModBlockNeteaseEffectCreatedClientEventArgs;
  OnNewArmorExchangeServerEvent: OnNewArmorExchangeServerEventArgs;
  OnOffhandItemChangedServerEvent: OnOffhandItemChangedServerEventArgs;
  OnPlayerActionServerEvent: OnPlayerActionServerEventArgs;
  OnPlayerActiveShieldServerEvent: OnPlayerActiveShieldServerEventArgs;
  OnPlayerBlockedByShieldAfterServerEvent: OnPlayerBlockedByShieldAfterServerEventArgs;
  OnPlayerBlockedByShieldBeforeServerEvent: OnPlayerBlockedByShieldBeforeServerEventArgs;
  OnPlayerHitBlockClientEvent: OnPlayerHitBlockClientEventArgs;
  OnPlayerHitBlockServerEvent: OnPlayerHitBlockServerEventArgs;
  OnRainLevelChangeServerEvent: OnRainLevelChangeServerEventArgs;
  OnScriptTickClient: OnScriptTickClientEventArgs;
  OnScriptTickServer: OnScriptTickServerEventArgs;
  OnStandOnBlockClientEvent: OnStandOnBlockClientEventArgs;
  OnStandOnBlockServerEvent: OnStandOnBlockServerEventArgs;
  PerspChangeClientEvent: PerspChangeClientEventArgs;
  PistonActionServerEvent: PistonActionServerEventArgs;
  PlaceNeteaseLargeFeatureServerEvent: PlaceNeteaseLargeFeatureServerEventArgs;
  PlaceNeteaseStructureFeatureEvent: PlaceNeteaseStructureFeatureEventArgs;
  PlayerAddCustomContainerItemClientEvent: PlayerAddCustomContainerItemClientEventArgs;
  PlayerAddCustomContainerItemServerEvent: PlayerAddCustomContainerItemServerEventArgs;
  PlayerAttackEntityEvent: PlayerAttackEntityEventArgs;
  PlayerCheatSpinAttackServerEvent: PlayerCheatSpinAttackServerEventArgs;
  PlayerDieEvent: PlayerDieEventArgs;
  PlayerDoInteractServerEvent: PlayerDoInteractServerEventArgs;
  PlayerDropItemServerEvent: PlayerDropItemServerEventArgs;
  PlayerEatFoodServerEvent: PlayerEatFoodServerEventArgs;
  PlayerFeedEntityServerEvent: PlayerFeedEntityServerEventArgs;
  PlayerFishingAfterServerEvent: PlayerFishingAfterServerEventArgs;
  PlayerFishingServerEvent: PlayerFishingServerEventArgs;
  PlayerHungerChangeServerEvent: PlayerHungerChangeServerEventArgs;
  PlayerHurtEvent: PlayerHurtEventArgs;
  PlayerIntendLeaveServerEvent: PlayerIntendLeaveServerEventArgs;
  PlayerInteractServerEvent: PlayerInteractServerEventArgs;
  PlayerJoinMessageEvent: PlayerJoinMessageEventArgs;
  PlayerLeftMessageServerEvent: PlayerLeftMessageServerEventArgs;
  PlayerNamedEntityServerEvent: PlayerNamedEntityServerEventArgs;
  PlayerPermissionChangeClientEvent: PlayerPermissionChangeClientEventArgs;
  PlayerPermissionChangeServerEvent: PlayerPermissionChangeServerEventArgs;
  PlayerPickupArrowServerEvent: PlayerPickupArrowServerEventArgs;
  PlayerRemoveCustomContainerItemClientEvent: PlayerRemoveCustomContainerItemClientEventArgs;
  PlayerRemoveCustomContainerItemServerEvent: PlayerRemoveCustomContainerItemServerEventArgs;
  PlayerRespawnEvent: PlayerRespawnEventArgs;
  PlayerRespawnFinishServerEvent: PlayerRespawnFinishServerEventArgs;
  PlayerSleepServerEvent: PlayerSleepServerEventArgs;
  PlayerSpinAttackServerEvent: PlayerSpinAttackServerEventArgs;
  PlayerStartFishingServerEvent: PlayerStartFishingServerEventArgs;
  PlayerStopSleepServerEvent: PlayerStopSleepServerEventArgs;
  PlayerTeleportEvent: PlayerTeleportEventArgs;
  PlayerTryAddCustomContainerItemClientEvent: PlayerTryAddCustomContainerItemClientEventArgs;
  PlayerTryAddCustomContainerItemServerEvent: PlayerTryAddCustomContainerItemServerEventArgs;
  PlayerTryDestroyBlockClientEvent: PlayerTryDestroyBlockClientEventArgs;
  PlayerTryDropItemClientEvent: PlayerTryDropItemClientEventArgs;
  PlayerTryPutCustomContainerItemClientEvent: PlayerTryPutCustomContainerItemClientEventArgs;
  PlayerTryPutCustomContainerItemServerEvent: PlayerTryPutCustomContainerItemServerEventArgs;
  PlayerTryRemoveCustomContainerItemClientEvent: PlayerTryRemoveCustomContainerItemClientEventArgs;
  PlayerTryRemoveCustomContainerItemServerEvent: PlayerTryRemoveCustomContainerItemServerEventArgs;
  PlayerTrySleepServerEvent: PlayerTrySleepServerEventArgs;
  ProjectileCritHitEvent: ProjectileCritHitEventArgs;
  ProjectileDoHitEffectEvent: ProjectileDoHitEffectEventArgs;
  RefreshEffectServerEvent: RefreshEffectServerEventArgs;
  RemoveEffectServerEvent: RemoveEffectServerEventArgs;
  RemoveEntityClientEvent: RemoveEntityClientEventArgs;
  RemovePlayerAOIClientEvent: RemovePlayerAOIClientEventArgs;
  ServerBlockEntityTickEvent: ServerBlockEntityTickEventArgs;
  ServerBlockUseEvent: ServerBlockUseEventArgs;
  ServerChatEvent: ServerChatEventArgs;
  ServerEntityTryPlaceBlockEvent: ServerEntityTryPlaceBlockEventArgs;
  ServerItemTryUseEvent: ServerItemTryUseEventArgs;
  ServerItemUseOnEvent: ServerItemUseOnEventArgs;
  ServerPlaceBlockEntityEvent: ServerPlaceBlockEntityEventArgs;
  ServerPlayerGetExperienceOrbEvent: ServerPlayerGetExperienceOrbEventArgs;
  ServerPlayerTryDestroyBlockEvent: ServerPlayerTryDestroyBlockEventArgs;
  ServerPlayerTryTouchEvent: ServerPlayerTryTouchEventArgs;
  ServerPostBlockPatternEvent: ServerPostBlockPatternEventArgs;
  ServerPreBlockPatternEvent: ServerPreBlockPatternEventArgs;
  ServerSpawnMobEvent: ServerSpawnMobEventArgs;
  ShearsDestoryBlockBeforeClientEvent: ShearsDestoryBlockBeforeClientEventArgs;
  ShearsDestoryBlockBeforeServerEvent: ShearsDestoryBlockBeforeServerEventArgs;
  ShearsUseToBlockBeforeServerEvent: ShearsUseToBlockBeforeServerEventArgs;
  SpawnProjectileServerEvent: SpawnProjectileServerEventArgs;
  StartDestroyBlockClientEvent: StartDestroyBlockClientEventArgs;
  StartDestroyBlockServerEvent: StartDestroyBlockServerEventArgs;
  StartRidingClientEvent: StartRidingClientEventArgs;
  StartRidingServerEvent: StartRidingServerEventArgs;
  StartUsingItemClientEvent: StartUsingItemClientEventArgs;
  StepOffBlockClientEvent: StepOffBlockClientEventArgs;
  StepOffBlockServerEvent: StepOffBlockServerEventArgs;
  StepOnBlockClientEvent: StepOnBlockClientEventArgs;
  StepOnBlockServerEvent: StepOnBlockServerEventArgs;
  StopUsingItemClientEvent: StopUsingItemClientEventArgs;
  StoreBuySuccServerEvent: StoreBuySuccServerEventArgs;
  UIContainerItemChangedServerEvent: UIContainerItemChangedServerEventArgs;
  UnLoadClientAddonScriptsBefore: UnLoadClientAddonScriptsBeforeEventArgs;
  UpdatePlayerSkinClientEvent: UpdatePlayerSkinClientEventArgs;
  WillAddEffectServerEvent: WillAddEffectServerEventArgs;
  WillTeleportToServerEvent: WillTeleportToServerEventArgs;
}
type ServerEventName = keyof EventNameArgs;
