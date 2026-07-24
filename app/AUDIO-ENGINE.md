# 고품질 트럼펫 합성 엔진

이 앱은 녹음 샘플, CDN, 네트워크 요청 없이 Web Audio API만으로 B♭ 트럼펫 음색을 실시간 합성한다. 최종 단일 `index.html`에 코드만 포함되므로 오프라인과 Vercel 정적 배포에서 같은 소리가 난다.

## 신호 흐름

```text
band-limited lip-buzz PeriodicWave ─ soft waveshaper ─┐
fundamental body sine ────────────────────────────────┤
seeded breath noise ─ HPF/BPF ───────────────────────┤
seeded tongue transient ─ BPF ───────────────────────┘
        ↓
105 Hz HPF
        ↓
dynamic brightness LPF
        ↓
fixed bell/body formants
        ↓
amp envelope + delayed vibrato/tremolo
        ↓
dry ────────────────────────────────┐
short synthetic room convolution ──┤
        ↓                           ↓
        soft-knee compressor → destination
```

핵심 구현은 `src/audio.js`의 `AudioController`다.

- 음마다 샘플레이트의 47% 아래까지만 최대 40개 배음을 만든다.
- 배음은 700Hz 관체 공명과 6kHz 부근 벨 포먼트를 반영한 `PeriodicWave` 한 개로 합성한다.
- 부드러운 `tanh` 포화와 2배 오버샘플링으로 금관 버즈를 만들면서 앨리어싱을 억제한다.
- 고정 시드 노이즈를 짧은 텅잉 어택과 매우 약한 지속 브레스로 나눠 사용한다.
- 어택 중 밝기 필터가 열렸다가 안정되고, 음정은 짧은 스쿠프 후 중심음에 정착한다.
- 비브라토는 음 시작 직후가 아니라 약 270ms 뒤에 서서히 들어온다.
- 짧은 스테레오 룸 임펄스도 런타임에 절차적으로 생성한다.
- 같은 음색·다이내믹·음높이의 웨이브테이블과 소프트 클립 곡선은 재사용한다.
- 연속 음은 AudioContext나 전체 그래프를 다시 만들지 않고 하나의 모노포닉 음성을 재아티큘레이션한다.

## 사용자 프리셋

| 설정 | 청감 목표 | 함께 바뀌는 요소 |
|---|---|---|
| 콘서트 오픈 | 균형 잡힌 일반 트럼펫 | 700Hz 바디, 6kHz 벨, 중간 브레스 |
| 웜 브라스 | 둥글고 부드러운 소리 | 낮은 컷오프, 강한 기본음, 긴 룸 반사 |
| 컵 뮤트 | 좁고 비음 섞인 약음기 | 1.26kHz·2.95kHz 공명, 낮은 컷오프 |
| 부드럽게 p | 여린 연주 | 느린 어택, 어두운 배음, 낮은 레벨 |
| 자연스럽게 mf | 기본 연주 | 균형 어택·밝기·레벨 |
| 힘차게 f | 강한 연주 | 빠른 어택, 높은 배음, 강한 텅잉·브레스 |

다이내믹은 단순 음량 조절이 아니다. 어택 시간, 배음 기울기, 필터 밝기, 텅잉과 브레스의 비율도 함께 바뀐다.

## 실제 Chrome 신호 QA

`tests/e2e/app.spec.mjs`는 `OfflineAudioContext`로 C4를 직접 렌더링하고 다음을 검증한다.

- 모든 프리셋이 무음이 아니고 최대 피크가 `0.98` 미만이다.
- DC 오프셋 절댓값이 `0.01` 미만이다.
- 어택이 100ms 안에 시작된다.
- 릴리스 뒤 꼬리 RMS가 지속 RMS의 20% 미만이다.
- `p < mf < f` 순서로 지속 RMS가 커진다.
- `p < f` 순서로 정규화한 고역 변화량이 커진다.

2026-07-24 Chrome QA에서 C4의 측정값은 다음과 같았다.

| 다이내믹 | Peak | Sustain RMS | Brightness proxy | Onset |
|---|---:|---:|---:|---:|
| p | 0.109 | 0.0429 | 0.0801 | 14.1ms |
| mf | 0.156 | 0.0502 | 0.1225 | 11.6ms |
| f | 0.203 | 0.0567 | 0.1784 | 10.5ms |

브라우저 계측에서는 AudioContext 1개, 오실레이터 3개, 노이즈 소스 1개, 필터 7개, 웨이브셰이퍼·컨볼버·컴프레서 각 1개가 생성됐다. 두 음을 연속 재생할 때 이 노드 수가 늘지 않는 것도 검증한다.

## 설계 참고 자료

- Horner & Beauchamp의 1995년 트럼펫 스펙트럴 합성 연구: <https://cmp.ischool.illinois.edu/beaucham/papers/JAES.10.95.pdf>
- Derenyi & Dannenberg, trumpet timbre morphing and articulation model: <https://www.cs.cmu.edu/~rbd/papers/csis98/csis98.pdf>
- Fletcher & Tarnopolsky, brass bore nonlinearity and spectral extension: <https://newt.phys.unsw.edu.au/music/people/publications/Fletcheretal1999.pdf>
- W3C Web Audio API: <https://www.w3.org/TR/webaudio-1.0/>

수치 검증은 클릭·과출력·성능 회귀를 잡는 장치다. 최종 음색 판단은 실제 휴대폰 스피커와 헤드폰에서 F♯3, C4, G4, C5, C6를 청음해 미세 조정한다.
