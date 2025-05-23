"use client";

import { useEffect, useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { ConnectButton, useConnectWallet, useWallets, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

interface LanguageTexts {
    pageTitle: string;
    docTitle: string;
    pageDescriptions: string;
    counterDescriptions: string[];
    counterUnit: string | string[];
    counterButton: string | string[];
    showCreditsText: string;
    showOptionsText: string;
    repositoryDesc: string;
}

interface Language {
    audioList: string[];
    texts: LanguageTexts;
    cardImage: string;
}

interface Languages {
    [key: string]: Language | {
        defaultLanguage: string;
        defaultVOLanguage: string;
        defaultSpeed: number;
        defaultRandmo: string;
    };
    _: {
        defaultLanguage: string;
        defaultVOLanguage: string;
        defaultSpeed: number;
        defaultRandmo: string;
    };
}

const LANGUAGES: Languages = {
    _: {
        defaultLanguage: "en",
        defaultVOLanguage: "ja",
        defaultSpeed: 20,
        defaultRandmo: "off"
    },
    en: {
        audioList: [
            '/static/audio/en/en_1.mp3',
            '/static/audio/en/en_2.mp3',
            '/static/audio/en/en_3.mp3'
        ],
        texts: {
            pageTitle: "Welcome to herta kuru~",
            docTitle: "Kuru Kuru~",
            pageDescriptions: "The website for Herta, the <del>annoying</del> cutest genius Honkai: Star Rail character out there.",
            counterDescriptions: ["The kuru~ has been squished for", "Herta has been kuru~ed for"],
            counterUnit: "times",
            counterButton: ["Squish the kuru~!", "Kuru kuru~!"],
            showCreditsText: "Show Credits",
            showOptionsText: "Options",
            repositoryDesc: "GitHub Repo"
        },
        cardImage: "/static/img/card_en.jpg"
    },
    cn: {
        audioList: [
            '/static/audio/cn/gululu.mp3',
            '/static/audio/cn/gururu.mp3',
            '/static/audio/cn/转圈圈.mp3',
            '/static/audio/cn/转圈圈咯.mp3',
            '/static/audio/cn/要坏掉了.mp3'
        ],
        texts: {
            pageTitle: "黑塔转圈圈",
            docTitle: "咕噜噜~",
            pageDescriptions: "给黑塔酱写的小网站，对，就是那个<del>烦人的</del>最可爱的《崩坏：星穹铁道》角色！",
            counterDescriptions: ["黑塔已经咕噜噜~了", "黑塔已经转了"],
            counterUnit: ["次", "次圈圈"],
            counterButton: ["转圈圈~", "咕噜噜！"],
            showCreditsText: "查看感谢页",
            showOptionsText: "设置",
            repositoryDesc: "GitHub 仓库"
        },
        cardImage: "/static/img/card_cn.jpg"
    },
    ja: {
        audioList: [
            '/static/audio/ja/kuruto.mp3',
            '/static/audio/ja/kuru1.mp3',
            '/static/audio/ja/kuru2.mp3'
        ],
        texts: {
            pageTitle: "ヘルタクルへようこそ~",
            docTitle: "クル クル~",
            pageDescriptions: "このサイトはヘルタのために作られた、あの崩壊：スターレイルの <del>悩ましい</del> かわいい天才キャラー。",
            counterDescriptions: ["全世界のクル再生数"],
            counterUnit: "回",
            counterButton: "クル クル~!",
            showCreditsText: "Show Credits",
            showOptionsText: "Options",
            repositoryDesc: "GitHub Repo"
        },
        cardImage: "/static/img/card_ja.jpg"
    }
};

// 修正这里的常量定义
const KURU_GAME_PACKAGE_ID = "0xbe8ee8c15da5eec1ad31c3712bdcc045cecc074bbac50c1c03c39d065ce279e4";
const KURU_GAME_ID = "0x92b5d4499101180351ecd41308c6d244b26aec9b8b9d0e63f1faa03f4a9e4825";
const RANDOM_OBJECT_ID = "0x8";
const HITCOIN_DECIMALS = 6; // HITCOIN的小数位数为6

export default function HertaKuru() {
    const wallets = useWallets();
    const { mutate: connect } = useConnectWallet();
    const suiClient = useSuiClient();

    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [currentLanguage, setCurrentLanguage] = useState<string>(LANGUAGES._.defaultLanguage);
    const [currentVOLanguage, setCurrentVOLanguage] = useState<string>(LANGUAGES._.defaultVOLanguage);
    const [speed, setSpeed] = useState<number>(LANGUAGES._.defaultSpeed);
    const [randomType, setRandomType] = useState<string>(LANGUAGES._.defaultRandmo);
    const [randomTexts, setRandomTexts] = useState<{
        counterDesc: string;
        counterUnit: string;
        counterButton: string;
    }>({ counterDesc: '', counterUnit: '', counterButton: '' });
    const [lastReward, setLastReward] = useState<number>(0);
    const [kuruCount, setKuruCount] = useState<number>(0);
    const [totalKuruCount, setTotalKuruCount] = useState<number>(0);
    const [animationInProgress, setAnimationInProgress] = useState<boolean>(false);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);

    // 添加一个函数来获取 total_kuru_count
    // 修正 fetchTotalKuruCount 函数中的对象ID
    const fetchTotalKuruCount = async () => {
        if (!suiClient) return;

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const gameObjectResponse = await suiClient.getObject({
                    id: KURU_GAME_ID,
                    options: {
                        showContent: true,
                    }
                });

                if (
                    gameObjectResponse &&
                    gameObjectResponse.data &&
                    gameObjectResponse.data.content &&
                    'fields' in gameObjectResponse.data.content
                ) {
                    const gameData = gameObjectResponse.data.content.fields;

                    if ('total_kuru_count' in gameData) {
                        const newCount = Number(gameData.total_kuru_count);
                        console.log(`获取到的全局kuru计数: ${newCount}`);
                        setTotalKuruCount(newCount);
                        return;
                    }
                }

                // 如果走到这里，说明没有找到total_kuru_count
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`获取总计数错误 (尝试 ${attempts + 1}/${maxAttempts}):`, error);
                attempts++;
                if (attempts >= maxAttempts) break;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.error("多次尝试获取总计数失败");
    };

    // 组件加载时获取总计数，并定期刷新
    useEffect(() => {
        fetchTotalKuruCount();

        // 每60秒自动刷新一次总数据
        const intervalId = setInterval(() => {
            fetchTotalKuruCount();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [suiClient]);

    useEffect(() => {
        // Load saved preferences

        const pathLang = window.location.pathname.split('/')[1];
        const langMap: { [key: string]: string } = {
            'zh': 'cn',
            'ja': 'ja',
            'en': 'en',
            'kr': 'kr'
        };

        // 设置默认语言
        const defaultLang = langMap[pathLang] || LANGUAGES._.defaultLanguage;
        setCurrentLanguage(defaultLang);
        setCurrentVOLanguage(defaultLang); // 假设语音语言与界面语言一致

        const savedLang = localStorage.getItem('lang');
        const savedVOLang = localStorage.getItem('volang');
        const savedSpeed = localStorage.getItem('speed');
        const savedRandom = localStorage.getItem('random');

        if (savedLang) setCurrentLanguage(savedLang);
        if (savedVOLang) setCurrentVOLanguage(savedVOLang);
        if (savedSpeed) setSpeed(parseInt(savedSpeed, 10));
        if (savedRandom) setRandomType(savedRandom);

        // 在客户端初始化时设置随机文本
        const texts = (LANGUAGES[currentLanguage] as Language).texts;
        setRandomTexts({
            counterDesc: getRandomText(texts.counterDescriptions),
            counterUnit: getRandomText(texts.counterUnit),
            counterButton: getRandomText(texts.counterButton)
        });
    }, [currentLanguage]);

    // 简化的动画处理函数，一次性播放指定次数的动画
    const playAnimationSequence = (count: number) => {
        if (count <= 0 || animationInProgress) return;

        setAnimationInProgress(true);
        console.log(`开始播放${count}次动画序列`);

        let remainingCount = count;
        let intervalId: NodeJS.Timeout;

        // 播放单个动画
        const playOneAnimation = () => {
            playAudio();
            animateHerta();
            remainingCount--;

            // 更新UI显示剩余次数
            if (remainingCount >= 0) {
                // 可以添加一个DOM元素来显示剩余次数
                console.log(`剩余${remainingCount}次动画`);
            }

            // 当所有动画播放完毕
            if (remainingCount <= 0) {
                clearInterval(intervalId);
                setTimeout(() => {
                    setAnimationInProgress(false);
                    setIsAnimating(false);
                    console.log("所有动画已播放完毕");
                }, 500);
            }
        };

        // 立即播放第一个动画
        playOneAnimation();

        // 设置间隔播放剩余动画
        intervalId = setInterval(() => {
            if (remainingCount > 0) {
                playOneAnimation();
            } else {
                clearInterval(intervalId);
            }
        }, 150); // 间隔1.5秒播放下一个动画

        // 安全机制：确保超时后会自动结束动画状态
        setTimeout(() => {
            if (animationInProgress) {
                clearInterval(intervalId);
                setAnimationInProgress(false);
                setIsAnimating(false);
                console.log("动画播放超时，已自动结束");
            }
        }, count * 2000 + 5000); // 给予充足的时间，但不会无限等待
    };

    const handleButtonClick = async () => {
        if (!account) {
            alert("请先连接钱包");
            return;
        }

        if (isAnimating || animationInProgress) {
            console.log("动画仍在进行中，请稍等");
            return;
        }

        // 设置加载状态
        setIsAnimating(true);

        const txb = new Transaction();
        txb.setSender(account.address);

        try {
            // 调用kuru_game模块中的play函数
            txb.moveCall({
                target: `${KURU_GAME_PACKAGE_ID}::kuru_game::play`,
                arguments: [
                    txb.object(KURU_GAME_ID), // game对象
                    txb.object(RANDOM_OBJECT_ID),
                ],
            });

            // 设置gas预算
            txb.setGasBudget(1e8);

            // 显示加载提示
            setIsAnimating(true);

            // 执行交易
            await signAndExecute({
                transaction: txb, chain: "sui:testnet"
            }, {
                onSuccess: async (result: any) => {
                    console.log("交易初步成功, 等待链上确认:", result.digest);

                    if (!result.digest) {
                        console.error("交易没有返回有效的digest");
                        alert("交易未返回有效标识，请检查钱包连接");
                        setIsAnimating(false);
                        return;
                    }

                    // 等待交易确认并获取详细结果
                    try {
                        await getTransactionResult(result.digest);
                    } catch (error) {
                        console.error("等待交易确认失败:", error);
                        alert("交易可能已提交但无法确认状态，请刷新页面查看结果");
                        setIsAnimating(false);
                    }
                },
                onError: (error: any) => {
                    console.error("交易失败:", error);
                    alert(error.message || "交易失败");
                    setIsAnimating(false);
                },
            });

        } catch (error) {
            console.error("提交交易失败:", error);
            alert("转圈圈失败，请重试");
            setIsAnimating(false);
        }
    };

    // 修改为更简化的交易结果获取函数
    const getTransactionResult = async (digest: string) => {
        if (!suiClient) {
            console.error("SUI客户端未初始化");
            setIsAnimating(false);
            return;
        }

        try {
            console.log(`开始等待交易 ${digest} 确认...`);

            // 最多尝试30次，每次间隔1秒
            let attempts = 0;
            const maxAttempts = 30;
            let transactionBlock = null;

            // 轮询直到交易确认或超时
            while (attempts < maxAttempts) {
                attempts++;
                console.log(`第${attempts}次尝试获取交易结果...`);

                try {
                    // 获取交易详情
                    transactionBlock = await suiClient.getTransactionBlock({
                        digest,
                        options: {
                            showEffects: true,
                            showEvents: true,
                            showInput: true,
                        }
                    });

                    // 如果成功获取交易详情并且状态是成功
                    if (transactionBlock?.effects?.status?.status === "success") {
                        console.log("交易已成功确认");

                        // 处理交易结果
                        const { reward, count } = extractTransactionData(transactionBlock);
                        console.log(`从交易中提取到: 奖励=${reward}, 圈数=${count}`);

                        // 更新状态
                        setLastReward(reward);
                        setKuruCount(count);

                        // 显示奖励信息
                        if (reward > 0) {
                            alert(`恭喜获得 ${formatHitcoin(reward)} HITCOIN!`);
                        }

                        // 刷新总计数
                        await fetchTotalKuruCount();

                        // 开始播放动画序列
                        playAnimationSequence(Math.max(1, count));
                        return;
                    }

                    if (transactionBlock?.effects?.status?.status === "failure") {
                        console.error("交易已确认但失败");
                        alert("交易执行失败: " + (transactionBlock.effects.status.error || "未知错误"));
                        setIsAnimating(false);
                        return;
                    }

                } catch (error: any) {
                    if (error.message && error.message.includes("Could not find")) {
                        console.log("交易尚未上链，继续等待...");
                    } else {
                        throw error;
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            console.error("等待交易确认超时");
            alert("交易确认超时，请刷新页面查看最新状态");
            setIsAnimating(false);

        } catch (error) {
            console.error("获取交易结果时出错:", error);
            alert("获取交易结果时出错，请刷新页面并检查钱包");
            setIsAnimating(false);
        }
    };

    // 提取交易数据的辅助函数
    const extractTransactionData = (txBlock: any) => {
        let reward = 0;
        let count = 0;

        // 尝试从返回值获取结果
        if (txBlock.effects?.returnValues?.length >= 2) {
            const returnValues = txBlock.effects.returnValues;

            try {
                // 尝试获取reward (第一个返回值)
                if (returnValues[0]) {
                    if (typeof returnValues[0] === 'object' && 'valueType' in returnValues[0]) {
                        reward = Number(returnValues[0].value || 0);
                    } else if (Array.isArray(returnValues[0])) {
                        reward = Number(returnValues[0][1] || 0);
                    } else {
                        reward = Number(returnValues[0] || 0);
                    }
                }

                // 尝试获取count (第二个返回值)
                if (returnValues[1]) {
                    if (typeof returnValues[1] === 'object' && 'valueType' in returnValues[1]) {
                        count = Number(returnValues[1].value || 0);
                    } else if (Array.isArray(returnValues[1])) {
                        count = Number(returnValues[1][1] || 0);
                    } else {
                        count = Number(returnValues[1] || 0);
                    }
                }
            } catch (e) {
                console.error("解析返回值时出错:", e);
            }
        }

        // 如果无法从返回值获取，尝试从事件中获取
        if ((reward === 0 || count === 0) && txBlock.events?.length > 0) {
            const playEvent = txBlock.events.find((event: any) =>
                event?.type?.includes("PlayEvent")
            );

            if (playEvent?.parsedJson) {
                if (reward === 0) {
                    reward = Number(playEvent.parsedJson.reward || 0);
                }
                if (count === 0) {
                    count = Number(playEvent.parsedJson.kuru_count || 0);
                }
            }
        }

        // 如果仍然没有获取到有效值，使用默认值
        if (count === 0) count = 5; // 默认5圈

        return { reward, count };
    };

    // 添加一个格式化HitCoin的函数
    const formatHitcoin = (amount: number): string => {
        // 将数值除以10^6(即10的HITCOIN_DECIMALS次方)
        const formattedAmount = amount / Math.pow(10, HITCOIN_DECIMALS);

        // 使用toLocaleString确保数字格式化正确，保留最多6位小数
        // 注意：正则表达式移除末尾的多余0
        return formattedAmount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: HITCOIN_DECIMALS
        }).replace(/\.?0+$/, '');
    };

    const playAudio = () => {
        const audioList = (LANGUAGES[currentVOLanguage] as Language).audioList;
        const randomIndex = Math.floor(Math.random() * audioList.length);
        const audio = new Audio(audioList[randomIndex]);
        audio.play();
        audio.addEventListener("ended", () => {
            audio.remove();
        });
    };

    const animateHerta = () => {
        const random = Math.floor(Math.random() * 2) + 1;
        const elem = document.createElement("img");
        let runSpeed = speed;

        elem.src = `/static/img/hertaa${random}.gif`;
        elem.style.position = "absolute";
        elem.style.left = "100%";
        elem.style.bottom = "2%";
        elem.style.height = "68vh";
        elem.style.width = "auto";
        elem.style.zIndex = "1";
        elem.className = "animateHerta";
        const wrapper = document.querySelector('.wrapper');
        if (wrapper) {
            wrapper.appendChild(elem);
        }

        if (randomType === "on") {
            if (window.innerWidth >= 1280) {
                runSpeed = Math.floor(Math.random() * 30) + 20;
            } else {
                const randomSpeed = Math.floor(Math.random() * 40) + 50;
                runSpeed = Math.floor(window.innerWidth / (100 - randomSpeed));
            }
        } else {
            runSpeed = Math.floor(window.innerWidth / (100 - speed));
        }

        let pos = window.innerWidth;
        const id = setInterval(() => {
            if (pos < -200) {
                clearInterval(id);
                elem.remove();
            } else {
                pos -= runSpeed;
                elem.style.left = `${pos}px`;
            }
        }, 12);
    };

    const getRandomText = (text: string | string[]): string => {
        if (Array.isArray(text)) {
            return text[Math.floor(Math.random() * text.length)];
        }
        return text;
    };

    const texts = (LANGUAGES[currentLanguage] as Language).texts;

    return (
        <>
            <div className="wallet-corner">
                <ConnectButton className="connect-button" />
                <div className="wallet-dropdown">
                    {wallets.map((wallet) => (
                        <button
                            key={wallet.name}
                            className="wallet-item"
                            onClick={() => connect({ wallet })}
                        >
                            {wallet.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mdui-container-fluid">
                <main className="wrapper">
                    <div id="wrapper-background-filter"></div>
                    <div id="wrapper-background"></div>
                    <div id="content">
                        <div id="title-container">
                            <h1 id="page-title">{texts.pageTitle}</h1>
                            <img
                                id="title-img"
                                alt="img of herta"
                                src="/static/img/hertaa_github.gif"
                            />
                        </div>

                        <h2
                            id="page-descriptions"
                            dangerouslySetInnerHTML={{ __html: texts.pageDescriptions }}
                        />

                        <div id="counter-container">
                            <h3 id="counter-descriptions">
                                {randomTexts.counterDesc || texts.counterDescriptions[0]}
                            </h3>
                            <p id="total-counter" style={{ fontSize: '2em', color: '#8a2be2', fontWeight: 'bold' }}>
                                {totalKuruCount.toLocaleString('en-US')}
                            </p>
                            <p id="counter-unit">
                                {randomTexts.counterUnit || (Array.isArray(texts.counterUnit) ? texts.counterUnit[0] : texts.counterUnit)}
                            </p>
                            {lastReward > 0 && (
                                <p id="reward-text" style={{ color: '#ff8800', fontWeight: 'bold' }}>
                                    上次奖励: {formatHitcoin(lastReward)} HITCOIN
                                </p>
                            )}
                            {kuruCount > 0 && (
                                <p id="kuru-count-text" style={{ fontSize: '1em', marginBottom: '8px', color: '#ff5588' }}>
                                    上次转了 {kuruCount} 圈圈!
                                </p>
                            )}
                            <button
                                id="counter-button"
                                onClick={handleButtonClick}
                                disabled={isAnimating || animationInProgress}
                                style={(isAnimating || animationInProgress) ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                            >
                                {(isAnimating || animationInProgress) ? '正在转圈圈...' :
                                    (randomTexts.counterButton || (Array.isArray(texts.counterButton) ? texts.counterButton[0] : texts.counterButton))}
                            </button>

                            {/* 显示当前剩余动画数量的指示器 */}
                            {animationInProgress && (
                                <p style={{ fontSize: '0.8em', marginTop: '5px' }}>
                                    黑塔正在转圈圈...
                                </p>
                            )}
                        </div>
                    </div>
                </main>
                <div id="footer">
                    <img
                        id="herta-card"
                        loading="lazy"
                        src={(LANGUAGES[currentLanguage] as Language).cardImage}
                        className="img-autocdn"
                        alt=""
                    />
                    <div id="footer-text">
                        <div className="mdui-list">
                            <a href="#" className="mdui-list-item mdui-ripple" id="show-credits-opt">
                                <i className="mdui-icon mdui-list-item-icon ion-md-people mdui-text-color-black-icon" />
                                <div className="mdui-list-item-content footer-icon-text about-link" id="show-credits-text">
                                    {texts.showCreditsText}
                                </div>
                            </a>
                            <a href="#" className="mdui-list-item mdui-ripple" id="show-options-opt">
                                <i className="mdui-icon mdui-list-item-icon material-icons mdui-text-color-black-icon">settings</i>
                                <div className="mdui-list-item-content footer-icon-text about-link" id="show-options-text">
                                    {texts.showOptionsText}
                                </div>
                            </a>
                            <a
                                href="https://github.com/duiqt/herta.kuru"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mdui-list-item mdui-ripple"
                            >
                                <i className="mdui-icon mdui-list-item-icon ion-logo-github mdui-text-color-black-icon" />
                                <div className="mdui-list-item-content footer-icon-text about-link">
                                    <span id="repository-desc">{texts.repositoryDesc}</span> - duiqt/herta_kuru
                                </div>
                            </a>
                        </div>
                        <div className="mdui-typo">
                            <div id="access-via-tip-parent" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}