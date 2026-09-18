import type { CharacterId } from '../../shared/types'
export function CharacterArt({
  id,
  className = '',
}: {
  id: CharacterId
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 240 250"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="120" cy="224" rx="68" ry="12" fill="#153f32" opacity=".12" />
      {id === 'shurale' ? (
        <>
          <path
            d="M61 96L33 67 43 119 74 135M177 96L207 67 195 120 170 134"
            fill="#5e7950"
          />
          <path
            d="M102 73Q87 31 107 16L119 54Q140 16 153 23L139 75"
            fill="#9caf79"
          />
          <path
            d="M82 154Q62 179 67 217L91 218 104 181 136 181 148 218 174 217Q172 175 153 153"
            fill="#61794d"
          />
          <path
            d="M85 131Q48 143 41 179L54 193 78 167M155 132Q190 142 198 180L186 194 161 165"
            fill="#75945a"
          />
          <path
            d="M62 87Q120 40 179 87L173 148Q164 185 120 190 75 184 66 148Z"
            fill="#829f62"
          />
          <path
            d="M69 88L83 56 102 74 119 49 137 72 165 57 176 91 154 100 120 89 87 102Z"
            fill="#425f41"
          />
          <path
            d="M89 114Q102 106 112 115M131 115Q144 106 155 114"
            stroke="#304e37"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="101" cy="124" rx="8" ry="11" fill="#f8edbe" />
          <ellipse cx="143" cy="124" rx="8" ry="11" fill="#f8edbe" />
          <circle cx="104" cy="125" r="4" fill="#213e2e" />
          <circle cx="140" cy="125" r="4" fill="#213e2e" />
          <path
            d="M104 153Q121 170 140 152"
            stroke="#304e37"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M117 139L123 133 128 141" fill="#587545" />
          <path
            d="M84 178L101 164 119 182 137 165 157 177 138 198 101 198Z"
            fill="#36573e"
          />
          <path
            d="M119 176Q102 188 119 200Q136 188 119 176Z"
            stroke="#d3bb70"
            strokeWidth="3"
          />
          <circle cx="57" cy="60" r="4" fill="#e1c877" />
          <circle cx="186" cy="45" r="3" fill="#e1c877" />
        </>
      ) : id === 'syuyumbike' ? (
        <>
          <path
            d="M85 116Q48 163 43 220Q120 244 195 220L152 115Z"
            fill="#a95249"
          />
          <path d="M87 137L69 217Q120 234 171 217L152 137Z" fill="#d6a15b" />
          <path
            d="M90 69Q61 109 81 163L96 136 148 139 162 161Q180 105 150 67Z"
            fill="#523e39"
          />
          <ellipse cx="120" cy="102" rx="36" ry="43" fill="#ebc6a0" />
          <path
            d="M79 81L86 45 104 54 120 25 136 54 154 45 162 81Z"
            fill="#c99f4f"
          />
          <path d="M84 77L155 77" stroke="#f7db8d" strokeWidth="6" />
          <path d="M120 48L128 62 120 74 112 62Z" fill="#478c80" />
          <path
            d="M97 102L107 102M135 102L145 102"
            stroke="#49392f"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M111 122Q120 129 129 122"
            stroke="#aa6352"
            strokeWidth="3"
            fill="none"
          />
          <path d="M120 145L105 170 120 195 135 170Z" fill="#f4d792" />
          <path
            d="M119 151V218M91 198L120 216 151 198"
            stroke="#8f6c37"
            strokeWidth="3"
            fill="none"
          />
          <circle cx="80" cy="111" r="6" fill="#e5bf67" />
          <circle cx="160" cy="111" r="6" fill="#e5bf67" />
        </>
      ) : id === 'su-anasy' ? (
        <>
          <path
            d="M81 57Q37 93 58 164L42 211Q82 234 113 215 148 244 199 214L178 153Q196 77 150 54Z"
            fill="#3e787d"
          />
          <path
            d="M90 130Q69 163 70 196L43 211Q69 227 99 212 134 241 184 218L151 146Z"
            fill="#69aeb2"
          />
          <ellipse cx="120" cy="96" rx="35" ry="41" fill="#d6d8b5" />
          <path
            d="M78 87Q81 35 133 45 174 51 165 99L141 80 128 60 103 89Z"
            fill="#2e686d"
          />
          <path
            d="M98 99L107 100M134 100L143 99"
            stroke="#2a5050"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M112 120Q120 126 129 119"
            stroke="#768868"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M74 145L58 175 90 183M152 144L173 175 145 182"
            fill="none"
            stroke="#9ec5b7"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M91 179L148 179M98 179V194M108 179V195M118 179V196M128 179V195M138 179V194"
            stroke="#e6c677"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M88 213Q110 201 132 215T179 218"
            stroke="#b7e0d1"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="47"
            cy="74"
            r="7"
            fill="none"
            stroke="#91c7c1"
            strokeWidth="2"
          />
          <circle
            cx="187"
            cy="120"
            r="5"
            fill="none"
            stroke="#91c7c1"
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <path
            d="M79 173L70 218 100 222 112 190M132 188L142 222 173 218 160 173"
            fill="#9c8672"
          />
          <path
            d="M76 123L44 144 38 180 57 192 84 164M161 123L193 144 204 180 185 192 158 164"
            fill="#b3a38a"
          />
          <path
            d="M66 91L73 179 102 201 148 201 171 177 177 91Z"
            fill="#d0bea0"
          />
          <path
            d="M64 93L64 56 86 56 86 74 107 74 107 46 132 46 132 74 154 74 154 56 178 56 178 93Z"
            fill="#d7c6a8"
          />
          <path
            d="M69 102L173 102M73 157L167 157M114 102V128M135 158V183"
            stroke="#b19d7e"
            strokeWidth="4"
          />
          <rect x="87" y="119" width="17" height="22" rx="8" fill="#485a48" />
          <rect x="139" y="119" width="17" height="22" rx="8" fill="#485a48" />
          <circle cx="98" cy="125" r="3" fill="#f5e7b9" />
          <circle cx="150" cy="125" r="3" fill="#f5e7b9" />
          <path
            d="M107 156Q121 166 135 156"
            stroke="#796c52"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M116 177L123 169 131 178 123 189Z" fill="#5c8670" />
          <path
            d="M92 61Q89 37 106 29L111 50M146 65Q157 38 170 44L161 66"
            fill="#729168"
          />
        </>
      )}
    </svg>
  )
}
