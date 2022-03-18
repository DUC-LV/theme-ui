/** @jsx jsx */
import { jsx, IntrinsicSxElements } from '@theme-ui/core'
import { css, CSSObject, get, Theme } from '@theme-ui/css'
import {
  ComponentType,
  FC,
  ReactNode,
  DetailedHTMLProps,
  HTMLAttributes,
  ElementType,
  ComponentProps,
  useMemo,
} from 'react'
import { MDXProvider as _MDXProvider, useMDXComponents } from '@mdx-js/react'

type MDXProviderComponentsKnownKeys = {
  [key in keyof IntrinsicSxElements]?: ComponentType<any> | string
}
export interface MDXProviderComponents extends MDXProviderComponentsKnownKeys {
  [key: string]: ComponentType<any> | string | undefined
}
export type MdxAliases = {
  [key in keyof IntrinsicSxElements]: keyof JSX.IntrinsicElements
}

export type MdxAliasesKeys = 'inlineCode' | 'thematicBreak' | 'root'

export type ThemedProps = {
  theme: Theme
}

export interface MdxProviderProps {
  components?: MDXProviderComponents
  children: ReactNode
}

// mdx components
const tags: Array<keyof IntrinsicSxElements> = [
  'p',
  'b',
  'i',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'img',
  'pre',
  'code',
  'ol',
  'ul',
  'li',
  'blockquote',
  'hr',
  'em',
  'table',
  'tr',
  'th',
  'td',
  'em',
  'strong',
  'del',
  // mdx
  'inlineCode',
  'thematicBreak',
  // other
  'div',
  // theme-ui
  'root',
]

const aliases = {
  inlineCode: 'code',
  thematicBreak: 'hr',
  root: 'div',
} as const

type Aliases = typeof aliases
const isAlias = (x: string): x is keyof Aliases => x in aliases

export type ThemedComponentName = keyof IntrinsicSxElements

const alias = (n: ThemedComponentName): keyof JSX.IntrinsicElements =>
  isAlias(n) ? aliases[n] : n

export const themed =
  (key: ThemedComponentName | (string & {})) =>
  ({ theme, ...rest }: ThemedProps) => {
    const extraStyles: CSSObject = {}

    if (key === 'th' || key === 'td') {
      const { align } = rest as DetailedHTMLProps<
        React.ThHTMLAttributes<HTMLTableHeaderCellElement>,
        HTMLTableHeaderCellElement
      >

      if (align !== 'char') extraStyles.textAlign = align
    }

    return css({ ...get(theme, `styles.${key}`), ...extraStyles })(theme)
  }

// opt out of typechecking whenever `as` prop is used
interface AnyComponentProps extends JSX.IntrinsicAttributes {
  [key: string]: unknown
}

export interface ThemedComponent<Name extends string> {
  (
    props: Name extends keyof JSX.IntrinsicElements ? ComponentProps<Name> : {}
  ): JSX.Element
}

export type ThemedComponentsDict = {
  [K in keyof IntrinsicSxElements]: K extends keyof Aliases
    ? ThemedComponent<Aliases[K]>
    : K extends keyof JSX.IntrinsicElements
    ? ThemedComponent<K>
    : never
}

const createThemedComponent = <Name extends string>(
  name: Name,
  variant: ThemedComponentName
): ThemedComponent<Name> => {
  const variantStyles = themed(variant)

  return (props) => {
    const css = (props as any)['css']

    return jsx(name, {
      ...props,
      css: css ? [css, variantStyles] : variantStyles,
    })
  }
}

interface ThemedDivProps
  extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {}

interface ThemedDiv {
  (props: ThemedDivProps): JSX.Element
}

const _Themed: ThemedDiv = createThemedComponent('div', 'div')

export const components = {} as ThemedComponentsDict

export const Themed = _Themed as ThemedDiv & ThemedComponentsDict

tags.forEach((tag) => {
  const component = createThemedComponent(alias(tag), tag)

  components[tag] = component
  Themed[tag] = component
})

const createComponents = (comps: MDXProviderComponents) => {
  const componentKeys = Object.keys(comps) as Array<keyof IntrinsicSxElements>

  const next = { ...components }

  // We enrich user's components with the styles from theme.styles.
  // Example: `components.p` will get the styles from `theme.styles.p` as className.
  // todo: test this behaviour
  componentKeys.forEach((key) => {
    const componentAtKey = comps[key]
    if (componentAtKey) {
      next[key] = (props) => jsx(componentAtKey, { ...props, css: themed(key) })
    }
  })
  return next
}

export const MDXProvider: FC<MdxProviderProps> = ({ components, children }) => {
  const outer = useMDXComponents() as MDXProviderComponents

  const themedComponents = useMemo(() => {
    return createComponents({ ...outer, ...components })
  }, [components, outer])

  return jsx(_MDXProvider, { components: themedComponents, children })
}
