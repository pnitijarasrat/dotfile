# Starts Starship on the active Theme's prompt (#154). Source it from ~/.zshrc
# in place of `eval "$(starship init zsh)"`.
# Before each prompt it reads the Switch's pointer, starship/active-theme, so
# a new prompt after `theme <name>` is that Theme's, in every open shell.
# Before any Switch, or if the Theme's prompt was never generated, it's
# starship.toml, which is Vintage's.
_starship_theme() {
  local dir=$HOME/.config/starship name
  [[ -r $dir/active-theme ]] && name=$(<$dir/active-theme)
  if [[ -n $name && -r $dir/themes/$name.toml ]]; then
    export STARSHIP_CONFIG=$dir/themes/$name.toml
  else
    export STARSHIP_CONFIG=$HOME/.config/starship.toml
  fi
}
precmd_functions+=(_starship_theme)
eval "$(starship init zsh)"
